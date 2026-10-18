import React from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsSubNav } from '../src/components/admin/settings/SettingsSubNav';
import { SettingsSaveBar } from '../src/components/admin/settings/SettingsSaveBar';
import { SETTINGS_TABS } from '../src/components/admin/settings/settingsNav';
import { validateEmail } from '../src/utils/security';

const ok = (n: string, c: boolean) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) process.exitCode = 1; };
const admin = fs.readFileSync(new URL('../src/pages/AdminPage.tsx', import.meta.url), 'utf8');

const html = renderToStaticMarkup(<SettingsSubNav active="contact" onChange={() => {}} counts={{ popups: 3 }} />);
ok('every settings section appears in the navigation', SETTINGS_TABS.every(t => html.includes(t.label)));
ok('exactly one section is selected (aria-selected)', (html.match(/aria-selected="true"/g) || []).length === 1);
ok('count badge shown', html.includes('(3)'));
ok('section ids are unique', new Set(SETTINGS_TABS.map(t => t.id)).size === SETTINGS_TABS.length);
for (const t of SETTINGS_TABS)
  ok(`"${t.id}" has a real content block (no unreachable/empty section)`, admin.includes(`settingsSubTab === '${t.id}' &&`));
ok('old giant "general" tab is gone', !admin.includes("settingsSubTab === 'general'"));
ok('sticky Save bar is a submit button', renderToStaticMarkup(<SettingsSaveBar />).includes('type="submit"'));
ok('Save is blocked for a malformed email (validation wired before save)', admin.includes('validateEmail(v.trim())') && admin.indexOf('badEmail') < admin.indexOf('contactEmail: settingsEmail'));
for (const bad of ['abc', 'a@b', '<x>@y.com', 'a b@c.com', ''])
  ok(`validateEmail rejects ${JSON.stringify(bad)}`, !validateEmail(bad));
ok('validateEmail accepts a normal address', validateEmail('support@shaktiseshantitak.com'));
