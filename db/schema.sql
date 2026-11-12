-- 脊柱随访 app 的 CloudBase PostgreSQL 表结构与行级权限（RLS）
-- 执行：tcb db execute --sql "$(cat db/schema.sql)"
-- 角色：
--   医生 = public.doctors 里有自己 uid 的登录用户：可读写全部患者与随访记录（团队共享）
--   患者 = 邮箱验证码登录的用户：只能读邮箱与自己一致的档案和记录，只能新增自己的记录；
--          还没有档案时可以用自己的邮箱自助建一份（self_registered = true）
--   其他人（匿名、未建档邮箱）：看不到任何数据

-- ---------- 表 ----------
CREATE TABLE IF NOT EXISTS public.doctors (
  uid        varchar(64) PRIMARY KEY,
  username   text,
  name       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patients (
  id           text PRIMARY KEY DEFAULT ('PT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  name         text NOT NULL,
  gender       text,
  age          integer,
  spine_region text NOT NULL DEFAULT 'lumbar' CHECK (spine_region IN ('lumbar', 'cervical')),
  hospital_id  text,
  phone        text,
  email        text,
  diagnosis    text,
  surgery      text,
  surgery_date text,
  is_demo      boolean NOT NULL DEFAULT false,
  -- 患者首次登录时自己建的档（医生端会标出来，便于甄别陌生人提交）
  self_registered boolean NOT NULL DEFAULT false,
  created_by   varchar(64) DEFAULT auth.uid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
-- 一个邮箱只对应一个患者档案，否则患者登录后会匹配到多个人
CREATE UNIQUE INDEX IF NOT EXISTS patients_email_key
  ON public.patients (lower(email)) WHERE email IS NOT NULL AND email <> '';
-- 已建好的库补上新列
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS self_registered boolean NOT NULL DEFAULT false;

-- data：页面里的随访记录对象（stage/date/各项评分/解读…）；answers：本次原始作答
CREATE TABLE IF NOT EXISTS public.records (
  id             text PRIMARY KEY DEFAULT ('REC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  patient_id     text NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  data           jsonb NOT NULL,
  answers        jsonb,
  submitted_by   varchar(64) DEFAULT auth.uid(),
  submitted_role text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS records_patient_idx ON public.records (patient_id, created_at);

-- ---------- 身份判断（SECURITY DEFINER：以表所有者身份读 doctors / auth.users） ----------
CREATE OR REPLACE FUNCTION public.is_doctor() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (SELECT 1 FROM public.doctors WHERE uid = auth.uid())
$$;

-- 从用户表取当前登录用户“已验证”的邮箱，不依赖登录令牌里是否带 email。
-- 邮箱验证码注册的用户 email_verified 为空，但 created_from = 'email' 说明邮箱已通过验证码验证；
-- 管理员在后台填写的邮箱（created_from = 'admin'）不算，避免冒用他人邮箱
CREATE OR REPLACE FUNCTION public.my_email() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT lower(u.email) FROM auth.users u
  WHERE u.sub = auth.uid()
    AND (coalesce(u.email_verified, false) OR u.created_from = 'email')
    AND u.email IS NOT NULL AND u.email <> ''
  LIMIT 1
$$;

-- 当前用户能访问的患者 id（医生除外），供 records 的策略使用
CREATE OR REPLACE FUNCTION public.my_patient_ids() RETURNS SETOF text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT p.id FROM public.patients p
  WHERE p.email IS NOT NULL AND p.email <> '' AND lower(p.email) = public.my_email()
$$;

REVOKE ALL ON FUNCTION public.is_doctor(), public.my_email(), public.my_patient_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_doctor(), public.my_email(), public.my_patient_ids() TO authenticated;

-- 前端用它判断角色：SELECT * FROM me
CREATE OR REPLACE VIEW public.me AS
  SELECT auth.uid() AS uid, public.is_doctor() AS is_doctor, public.my_email() AS email;

-- ---------- 行级权限 ----------
ALTER TABLE public.doctors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.doctors, public.patients, public.records, public.me FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients, public.records TO authenticated;
GRANT SELECT ON public.me TO authenticated;
-- doctors 表不对前端开放，只由管理员用 SQL 维护

DROP POLICY IF EXISTS patients_select ON public.patients;
DROP POLICY IF EXISTS patients_insert ON public.patients;
DROP POLICY IF EXISTS patients_update ON public.patients;
DROP POLICY IF EXISTS patients_delete ON public.patients;
-- 患者能看到的是邮箱与自己已验证邮箱一致的那一份档案。
-- 直接比较本行的 email（而不是查 my_patient_ids()），这样患者自助建档时 INSERT ... RETURNING 也能读回刚建的行
CREATE POLICY patients_select ON public.patients FOR SELECT TO authenticated
  USING (public.is_doctor() OR (email IS NOT NULL AND email <> '' AND lower(email) = public.my_email()));
-- 医生可以随意建档；患者只能用自己已验证的邮箱给自己建一份（每个邮箱唯一），且必须标记为自助建档
CREATE POLICY patients_insert ON public.patients FOR INSERT TO authenticated
  WITH CHECK (
    public.is_doctor()
    OR (
      public.my_email() IS NOT NULL
      AND lower(email) = public.my_email()
      AND self_registered
      AND NOT is_demo
      AND created_by = auth.uid()
    )
  );
CREATE POLICY patients_update ON public.patients FOR UPDATE TO authenticated
  USING (public.is_doctor()) WITH CHECK (public.is_doctor());
CREATE POLICY patients_delete ON public.patients FOR DELETE TO authenticated
  USING (public.is_doctor());

DROP POLICY IF EXISTS records_select ON public.records;
DROP POLICY IF EXISTS records_insert ON public.records;
DROP POLICY IF EXISTS records_update ON public.records;
DROP POLICY IF EXISTS records_delete ON public.records;
CREATE POLICY records_select ON public.records FOR SELECT TO authenticated
  USING (public.is_doctor() OR patient_id IN (SELECT public.my_patient_ids()));
CREATE POLICY records_insert ON public.records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_doctor()
    OR (patient_id IN (SELECT public.my_patient_ids()) AND submitted_by = auth.uid() AND submitted_role = 'patient')
  );
CREATE POLICY records_update ON public.records FOR UPDATE TO authenticated
  USING (public.is_doctor()) WITH CHECK (public.is_doctor());
CREATE POLICY records_delete ON public.records FOR DELETE TO authenticated
  USING (public.is_doctor());
