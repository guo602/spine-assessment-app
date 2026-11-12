// 从 src/App.tsx 里的 INITIAL_PATIENTS 生成示例数据 SQL（is_demo = true，不带邮箱，患者账号读不到）
// 用法：node db/gen-demo-sql.mjs > db/demo.sql
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const start = src.indexOf('const INITIAL_PATIENTS = [');
const end = src.indexOf('\n];', start);
if (start < 0 || end < 0) throw new Error('INITIAL_PATIENTS not found');
const literal = src.slice(start + 'const INITIAL_PATIENTS = '.length, end + 3);
const patients = new Function(`return ${literal}`)();

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const lines = ['BEGIN;', "DELETE FROM public.patients WHERE is_demo;"];
for (const p of patients) {
  lines.push(
    `INSERT INTO public.patients (id, name, gender, age, spine_region, hospital_id, phone, email, diagnosis, surgery, surgery_date, is_demo, created_by) VALUES (` +
      [p.id, p.name, p.gender].map(q).join(', ') +
      `, ${Number(p.age) || 'NULL'}, ` +
      [p.spineRegion || 'lumbar', p.hospitalId, p.phone].map(q).join(', ') +
      `, NULL, ` +
      [p.diagnosis, p.surgery, p.surgeryDate].map(q).join(', ') +
      `, true, NULL);`
  );
  (p.records || []).forEach((r, i) => {
    const { recordId, ...data } = r;
    lines.push(
      `INSERT INTO public.records (id, patient_id, data, submitted_by, submitted_role, created_at) VALUES (` +
        `${q(`${p.id}-${recordId}`)}, ${q(p.id)}, ${q(JSON.stringify(data))}::jsonb, NULL, 'doctor', ` +
        `${q(r.date)}::date + interval '${i} second');`
    );
  });
}
lines.push('COMMIT;');
console.log(lines.join('\n'));
