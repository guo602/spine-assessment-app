// 云端数据读写：PostgreSQL 表 patients / records，权限由行级安全策略控制（见 db/schema.sql）。
// 对页面暴露的仍是第七版的数据形状：{ id, name, ..., records: [{ recordId, stage, date, ...评分 }] }
import { db } from './cloudbase';

export type Role = 'doctor' | 'patient';
export interface Me {
  uid: string;
  isDoctor: boolean;
  email: string | null;
}

const fail = (action: string, error: any) => {
  const msg = error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error));
  return new Error(`${action}失败：${msg}`);
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
  return { uid: row.uid, isDoctor: row.is_doctor === true, email: row.email || null };
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
      phone: p.phone || null,
      email: p.email ? p.email.trim().toLowerCase() : null,
      diagnosis: p.diagnosis || null,
      surgery: p.surgery || null,
      surgery_date: p.surgeryDate || null
    })
    .select('*');
  if (error) {
    if (String(error.message || '').includes('patients_email_key')) {
      throw new Error('建档失败：该邮箱已绑定其他患者档案');
    }
    throw fail('建档', error);
  }
  return toPatient(data[0]);
}

// 患者首次登录、还没有档案时自己建档：邮箱必须是自己登录用的已验证邮箱（数据库策略会再校验一次）
export async function registerSelf(p: any, me: Me) {
  if (!me.email) throw new Error('建档失败：没有取到您已验证的登录邮箱，请退出后重新用邮箱验证码登录');
  const { data, error } = await db()
    .from('patients')
    .insert({
      name: p.name,
      gender: p.gender || null,
      age: Number(p.age) || null,
      spine_region: p.spineRegion || 'lumbar',
      phone: p.phone || null,
      email: me.email,
      diagnosis: p.diagnosis || null,
      self_registered: true,
      created_by: me.uid
    })
    .select('*');
  if (error) {
    if (String(error.message || '').includes('patients_email_key')) {
      throw new Error('建档失败：该邮箱已有档案，请刷新页面');
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
