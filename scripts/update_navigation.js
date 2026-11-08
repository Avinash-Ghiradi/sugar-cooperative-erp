const fs = require('fs');
const path = require('path');

// 1. Update AuthContext.jsx
const authContextPath = path.join(__dirname, '..', 'client', 'src', 'context', 'AuthContext.jsx');
let authContent = fs.readFileSync(authContextPath, 'utf8');

if (!authContent.includes("'notices'")) {
  authContent = authContent.replace(
    "'settings', 'import_export', 'backup'",
    "'notices', 'settings', 'import_export', 'backup'"
  );
  authContent = authContent.replace(
    "'circles', 'import_export'",
    "'circles', 'notices', 'import_export'"
  );
  fs.writeFileSync(authContextPath, authContent, 'utf8');
  console.log('Updated AuthContext.jsx with notices permission');
}

// 2. Update Sidebar.jsx
const sidebarPath = path.join(__dirname, '..', 'client', 'src', 'components', 'Sidebar.jsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarContent.includes("id: 'notices'")) {
  // Add Megaphone to lucide-react import
  if (!sidebarContent.includes('Megaphone')) {
    sidebarContent = sidebarContent.replace(
      'ShieldAlert,',
      'ShieldAlert, Megaphone,'
    );
  }

  // Add into MENU_ITEMS before settings
  sidebarContent = sidebarContent.replace(
    "{ id: 'settings', label: 'Cooperative Settings', icon: Settings },",
    "{ id: 'notices', label: 'Notice Board', icon: Megaphone },\n  { id: 'settings', label: 'Cooperative Settings', icon: Settings },"
  );

  // Add into getMenuLabel
  sidebarContent = sidebarContent.replace(
    "case 'settings': return isEnglish ? 'Cooperative Settings' : 'ಕಾರ್ಖಾನೆ ಸೆಟ್ಟಿಂಗ್ಸ್';",
    "case 'notices': return isEnglish ? 'Notice Board & Wishes' : 'ಸೂಚನಾ ಫಲಕ & ಪ್ರಕಟಣೆಗಳು';\n      case 'settings': return isEnglish ? 'Cooperative Settings' : 'ಕಾರ್ಖಾನೆ ಸೆಟ್ಟಿಂಗ್ಸ್';"
  );

  fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
  console.log('Updated Sidebar.jsx with Notice Board menu item');
}

// 3. Update App.jsx
const appPath = path.join(__dirname, '..', 'client', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('NoticeManager')) {
  // Import NoticeManager
  appContent = appContent.replace(
    "import AuditLogs from './components/Admin/AuditLogs';",
    "import AuditLogs from './components/Admin/AuditLogs';\nimport NoticeManager from './components/Admin/NoticeManager';"
  );

  // Add into renderActiveModule switch
  appContent = appContent.replace(
    "case 'settings': return <SettingsModule />;",
    "case 'notices': return <NoticeManager />;\n      case 'settings': return <SettingsModule />;"
  );

  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('Updated App.jsx with NoticeManager component');
}

// 4. Update Navbar.jsx
const navbarPath = path.join(__dirname, '..', 'client', 'src', 'components', 'Navbar.jsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

if (!navbarContent.includes('Megaphone') && !navbarContent.includes("setActiveModule('notices')")) {
  navbarContent = navbarContent.replace(
    'ChevronDown, Briefcase, Building2, CheckCircle2, Download, Printer',
    'ChevronDown, Briefcase, Building2, CheckCircle2, Download, Printer, Megaphone'
  );

  // Add Notice Board button next to Daily Work Summary button
  const noticeBtnCode = `
          {/* Quick Notice Board / Announcement Button */}
          {user?.role !== 'Shareholder' && (
            <button
              onClick={() => setActiveModule('notices')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title={isEnglish ? "Notice Board & Greetings" : "ಸೂಚನಾ ಫಲಕ & ಶುಭಾಶಯಗಳು"}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isEnglish ? "Notices" : "ಸೂಚನೆಗಳು"}</span>
            </button>
          )}
  `;

  navbarContent = navbarContent.replace(
    "{/* 5:20 PM Daily Work Summary Quick Print Button */}",
    `${noticeBtnCode}\n          {/* 5:20 PM Daily Work Summary Quick Print Button */}`
  );

  fs.writeFileSync(navbarPath, navbarContent, 'utf8');
  console.log('Updated Navbar.jsx with Notice shortcut button');
}

// 5. Update translations.js
const transPath = path.join(__dirname, '..', 'client', 'src', 'services', 'translations.js');
let transContent = fs.readFileSync(transPath, 'utf8');

if (!transContent.includes('menu_notices')) {
  transContent = transContent.replace(
    "menu_settings: 'ಕಾರ್ಖಾನೆ ಸೆಟ್ಟಿಂಗ್ಸ್',",
    "menu_notices: 'ಸೂಚನಾ ಫಲಕ & ಪ್ರಕಟಣೆಗಳು',\n    menu_settings: 'ಕಾರ್ಖಾನೆ ಸೆಟ್ಟಿಂಗ್ಸ್',"
  );
  transContent = transContent.replace(
    "menu_settings: 'Cooperative Settings',",
    "menu_notices: 'Notice Board & Wishes',\n    menu_settings: 'Cooperative Settings',"
  );
  fs.writeFileSync(transPath, transContent, 'utf8');
  console.log('Updated translations.js with menu_notices');
}

console.log('All navigation files updated successfully!');
