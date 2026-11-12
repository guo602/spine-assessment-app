import cloudbase from '@cloudbase/js-sdk';

export const ENV_ID = 'personal-puffin-d5f4pe5taa471ac1';

// region 必须是 ap-shanghai：环境在上海，验证码登录也只支持上海
export const app = cloudbase.init({ env: ENV_ID, region: 'ap-shanghai' });
export const auth = app.auth({ persistence: 'local' });
export const db = () => app.rdb();
