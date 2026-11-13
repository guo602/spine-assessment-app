// 云端数据读写：PostgreSQL 表 patients / records，权限由行级安全策略控制（见 db/schema.sql）。
// 对页面暴露的仍是第七版的数据形状：{ id, name, ..., records: [{ recordId, stage, date, ...评分 }] }
import { db } from './cloudbase';

export type Role = 'doctor' | 'patient';
export interface Me {
  uid: string;
  isDoctor: boolean;
  phone: string | null;
}

const fail = (action: string, error: any) => {
  const msg = error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error));
  return new Error(`${action}失败：${msg}`);
};

// 手机号归一化：去非数字、去 0086/+86 前缀、取最后 11 位（与数据库 norm_phone 一致）
const normalizePhone = (p: any) => {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('0086')) d = d.slice(4);
  else if (d.startsWith('86') && d.length === 13) d = d.slice(2);
  return d.slice(-11);
};

const toPatient = (row: any, records: any[] = []) => ({
  id: row.id,
  name: row.name || '',
  gender: row.gender || '',
  age: row.age ?? '',
  spineRegion: row.spine_region || 'lumbar',
  hospitalId: row.hospital_id || '',
  phone: row.phone || '',
  email: row.email || '',
  diagnosis: row.diagnosis || '',
  surgery: row.surgery || '',
  surgeon: row.surgeon || '',
  surgeryDate: row.surgery_date || '',
  isDemo: !!row.is_demo,
  selfRegistered: !!row.self_registered,
  records
});

const toRecord = (row: any) => ({ ...(row.data || {}), recordId: row.id, submittedRole: row.submitted_role || '' });

export async function getMe(): Promise<Me> {
  const { data, error } = await db().from('me').select('*');
  if (error) throw fail('读取账号信息', error);
  const row = data?.[0] || {};
  return { uid: row.uid, isDoctor: row.is_doctor === true, phone: row.phone || null };
}

// 医生拿到全部患者，患者只拿到自己（由 RLS 过滤）
export async function loadPatients() {
  const [pts, recs] = await Promise.all([
    db().from('patients').select('*').order('created_at', { ascending: false }),
    db().from('records').select('id, patient_id, data, submitted_role, created_at').order('created_at', { ascending: true })
  ]);
  if (pts.error) throw fail('读取患者档案', pts.error);
  if (recs.error) throw fail('读取随访记录', recs.error);
  const byPatient = new Map<string, any[]>();
  for (const r of recs.data || []) {
    if (!byPatient.has(r.patient_id)) byPatient.set(r.patient_id, []);
    byPatient.get(r.patient_id)!.push(toRecord(r));
  }
  return (pts.data || []).map((p: any) => toPatient(p, byPatient.get(p.id) || []));
}

export async function createPatient(p: any) {
  const { data, error } = await db()
    .from('patients')
    .insert({
      name: p.name,
      gender: p.gender || null,
      age: Number(p.age) || null,
      spine_region: p.spineRegion || 'lumbar',
      hospital_id: p.hospitalId || null,
      phone: normalizePhone(p.phone) || null,
      email: p.email ? p.email.trim().toLowerCase() : null,
      diagnosis: p.diagnosis || null,
      surgery: p.surgery || null,
      surgeon: p.surgeon || null,
      surgery_date: p.surgeryDate || null
    })
    .select('*');
  if (error) {
    if (String(error.message || '').includes('patients_phone_key')) {
      throw new Error('建档失败：该手机号已绑定其他患者档案');
    }
    throw fail('建档', error);
  }
  return toPatient(data[0]);
}

// 患者首次登录、还没有档案时自己建档：手机号必须是自己的登录手机号（数据库策略会再校验一次）
export async function registerSelf(p: any, me: Me) {
  if (!me.phone) throw new Error('建档失败：没有取到您的登录手机号，请退出后重新用手机验证码登录');
  const { data, error } = await db()
    .from('patients')
    .insert({
      name: p.name,
      gender: p.gender || null,
      age: Number(p.age) || null,
      spine_region: p.spineRegion || 'lumbar',
      phone: me.phone,
      email: p.email || null,
      diagnosis: p.diagnosis || null,
      self_registered: true,
      created_by: me.uid
    })
    .select('*');
  if (error) {
    if (String(error.message || '').includes('patients_phone_key')) {
      throw new Error('建档失败：该手机号已有档案，请刷新页面');
    }
    throw fail('建档', error);
  }
  return toPatient(data[0]);
}

export async function updatePatientRegion(patientId: string, spineRegion: string) {
  const { error } = await db()
    .from('patients')
    .update({ spine_region: spineRegion, updated_at: new Date().toISOString() })
    .eq('id', patientId);
  if (error) throw fail('更新疾病部位', error);
}

export async function deletePatient(patientId: string) {
  const { error } = await db().from('patients').delete().eq('id', patientId);
  if (error) throw fail('删除病例', error);
}

export async function addRecord(patientId: string, record: any, answers: any, role: Role, uid: string) {
  const { recordId, ...data } = record;
  const { data: rows, error } = await db()
    .from('records')
    .insert({ patient_id: patientId, data, answers, submitted_by: uid, submitted_role: role })
    .select('id, data, submitted_role');
  if (error) throw fail('保存随访记录', error);
  return toRecord(rows[0]);
}

export async function deleteRecord(recordId: string) {
  const { error } = await db().from('records').delete().eq('id', recordId);
  if (error) throw fail('删除随访记录', error);
}

// ---------- 专属二维码（token）访问：患者扫码后无需登录 ----------

// 患者用 token 读自己的档案与随访记录；token 无效时返回 null
export async function patientByToken(token: string) {
  const { data, error } = await db().rpc('patient_by_token', { p_token: token });
  if (error) throw fail('读取档案', error);
  if (!data || !data.id) return null;
  return {
    id: data.id,
    name: data.name || '',
    gender: data.gender || '',
    age: data.age ?? '',
    spineRegion: data.spineRegion || 'lumbar',
    hospitalId: data.hospitalId || '',
    phone: data.phone || '',
    email: data.email || '',
    diagnosis: data.diagnosis || '',
    surgery: data.surgery || '',
    surgeon: data.surgeon || '',
    surgeryDate: data.surgeryDate || '',
    isDemo: false,
    selfRegistered: false,
    records: (data.records || []).map((r: any) => ({ ...r }))
  };
}

// 患者用 token 提交一次随访记录，返回 { recordId }
export async function patientSubmit(token: string, record: any, answers: any) {
  const { recordId, ...data } = record;
  const { data: rows, error } = await db().rpc('patient_submit', {
    p_token: token,
    p_data: data,
    p_answers: answers
  });
  if (error) throw fail('提交', error);
  return rows;
}

// 医生为患者生成/刷新专属二维码 token（每次生成新 token，旧链接随即失效）
export async function setPatientToken(patientId: string) {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const { error } = await db().from('patients').update({ token }).eq('id', patientId);
  if (error) throw fail('生成二维码', error);
  return token;
}
