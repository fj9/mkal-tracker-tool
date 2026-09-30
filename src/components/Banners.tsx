import { backupReminderDue } from "../lib/backup";
import { hrefFor } from "../router";
import { useSettings } from "../state/AppContext";

const standalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** Install suggestion after the first session, and the weekly backup reminder. */
export function Banners() {
  const { settings, update, ready } = useSettings();
  if (!ready || !settings.welcomeSeen) return null;
  const showInstall = !!settings.firstUsed && !settings.installHintSeen && !standalone();
  const showBackup = backupReminderDue(settings.firstUsed, settings.lastBackedUp);
  return (
    <>
      {showInstall && (
        <div className="notice" role="status">
          Add this app to your home screen so your browser is less likely to clear your progress.
          iPhone: Share, then Add to Home Screen. Android: browser menu, then Install app.
          <div><button className="btn" style={{ minHeight: 40, marginTop: 8 }} onClick={() => update({ installHintSeen: true })}>Got it</button></div>
        </div>
      )}
      {showBackup && (
        <div className="notice" role="status">
          You have not backed up this week. <a href={hrefFor.settings()}>Back up in Settings</a>
        </div>
      )}
    </>
  );
}
