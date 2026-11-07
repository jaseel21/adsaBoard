import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Send,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  KeyRound,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import {
  getEmailConfig,
  saveEmailConfig,
  sendTestVerificationEmail,
} from '../../../utils/emailDispatchService';

const GOOGLE_APPS_SCRIPT_SNIPPET = `/**
 * ADSA Dining Board - Free Gmail Webhook Dispatcher
 * Paste this into script.google.com and click:
 * Deploy -> New Deployment -> Web App (Execute as: Me, Who has access: Anyone)
 */
function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var to = body.to;
    var subject = body.subject || "ADSA Dining Board Notification";
    var htmlBody = body.html || body.text;
    
    if (!to) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Missing recipient 'to'" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: htmlBody
    });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, timestamp: new Date() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function EmailSmtpConfigModal({ isOpen, onClose }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const [provider, setProvider] = useState('webhook'); // 'webhook' | 'emailjs' | 'firebase'
  const [webhookUrl, setWebhookUrl] = useState('');
  const [emailjsServiceId, setEmailjsServiceId] = useState('');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState('');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { success: boolean, msg: string }
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setTestStatus(null);
    setSaveSuccess(false);

    getEmailConfig()
      .then((cfg) => {
        setProvider(cfg.provider || 'webhook');
        setWebhookUrl(cfg.webhookUrl || '');
        setEmailjsServiceId(cfg.emailjsServiceId || '');
        setEmailjsTemplateId(cfg.emailjsTemplateId || '');
        setEmailjsPublicKey(cfg.emailjsPublicKey || '');
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SNIPPET);
    setCopiedCode(true);
    feedback('tick');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveEmailConfig({
        provider,
        webhookUrl: webhookUrl.trim(),
        emailjsServiceId: emailjsServiceId.trim(),
        emailjsTemplateId: emailjsTemplateId.trim(),
        emailjsPublicKey: emailjsPublicKey.trim(),
      });
      feedback('success');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      feedback('error');
      alert(`Could not save email configuration: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    const target = testEmail.trim();
    if (!target || !target.includes('@')) {
      alert('Please enter a valid recipient email address for testing.');
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    try {
      // Temporarily save or test with current values
      await saveEmailConfig({
        provider,
        webhookUrl: webhookUrl.trim(),
        emailjsServiceId: emailjsServiceId.trim(),
        emailjsTemplateId: emailjsTemplateId.trim(),
        emailjsPublicKey: emailjsPublicKey.trim(),
      });

      const res = await sendTestVerificationEmail(target);
      if (res.directDelivered) {
        feedback('success');
        setTestStatus({
          success: true,
          msg: `Success! Test email delivered directly via ${
            provider === 'webhook' ? 'Google Apps Script' : 'EmailJS'
          }. Check inbox at ${target}.`,
        });
      } else if (res.deliveryError) {
        feedback('error');
        setTestStatus({
          success: false,
          msg: `Delivery Failed: ${res.deliveryError}`,
        });
      } else {
        feedback('tick');
        setTestStatus({
          success: true,
          msg: `Queued to Firestore 'mail' collection. If Firebase Trigger Email is running, it will be dispatched shortly.`,
        });
      }
    } catch (err) {
      feedback('error');
      setTestStatus({
        success: false,
        msg: `Test Error: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Email & SMTP Delivery Setup
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure direct Gmail delivery for Password Reset OTPs & Notifications
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                <span>Loading configuration...</span>
              </div>
            ) : (
              <>
                {/* Method selector tabs */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Select Delivery Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Method 1: Google Apps Script */}
                    <button
                      type="button"
                      onClick={() => setProvider('webhook')}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        provider === 'webhook'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Google Apps Script
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        100% Free via institutional Gmail. No third-party signup & no Firebase Blaze plan required.
                      </p>
                    </button>

                    {/* Method 2: EmailJS */}
                    <button
                      type="button"
                      onClick={() => setProvider('emailjs')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        provider === 'emailjs'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-sky-600" />
                          EmailJS (Gmail SMTP)
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                          App Password
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Connects your 16-character Google App Password via EmailJS relay (200 free emails/month).
                      </p>
                    </button>
                  </div>
                </div>

                {/* PROVIDER 1: Google Apps Script Webhook */}
                {provider === 'webhook' && (
                  <div className="space-y-4 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-2.5">
                      <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          How to set up in 2 minutes (Zero Cost):
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400">
                          <li>
                            Open{' '}
                            <a
                              href="https://script.google.com"
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 underline font-medium inline-flex items-center gap-0.5"
                            >
                              script.google.com
                              <ExternalLink className="w-3 h-3 inline" />
                            </a>{' '}
                            while logged into your institutional Google/Gmail account.
                          </li>
                          <li>Click <strong>New Project</strong> and replace the code with the script below.</li>
                          <li>
                            Click <strong>Deploy &rarr; New Deployment</strong>, choose type <strong>Web App</strong>.
                          </li>
                          <li>
                            Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.
                          </li>
                          <li>Copy the resulting Web App URL and paste it in the field below.</li>
                        </ol>
                      </div>
                    </div>

                    {/* Script snippet with copy button */}
                    <div className="relative rounded-lg bg-slate-900 p-3 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800">
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-sans font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Script
                          </>
                        )}
                      </button>
                      <pre className="pr-20 max-h-36 overflow-y-auto">{GOOGLE_APPS_SCRIPT_SNIPPET}</pre>
                    </div>

                    {/* Webhook input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Google Apps Script Web App URL
                      </label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* PROVIDER 2: EmailJS */}
                {provider === 'emailjs' && (
                  <div className="space-y-4 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        EmailJS + Gmail App Password Instructions:
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        1. Sign up at{' '}
                        <a
                          href="https://dashboard.emailjs.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 underline font-medium inline-flex items-center gap-0.5"
                        >
                          emailjs.com <ExternalLink className="w-3 h-3" />
                        </a>
                        . Under <em>Email Services</em>, add <strong>Custom SMTP</strong> (Host: <code>smtp.gmail.com</code>, Port: <code>465</code>, Username: your Gmail, Password: your 16-character Google App Password).
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        2. Under <em>Email Templates</em>, create a template accepting <code>{`{{to_email}}`}</code> and <code>{`{{otp_code}}`}</code>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Service ID
                        </label>
                        <input
                          type="text"
                          value={emailjsServiceId}
                          onChange={(e) => setEmailjsServiceId(e.target.value)}
                          placeholder="service_adsa"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Template ID
                        </label>
                        <input
                          type="text"
                          value={emailjsTemplateId}
                          onChange={(e) => setEmailjsTemplateId(e.target.value)}
                          placeholder="template_otp"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Public Key
                        </label>
                        <input
                          type="text"
                          value={emailjsPublicKey}
                          onChange={(e) => setEmailjsPublicKey(e.target.value)}
                          placeholder="Public Key (User ID)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TEST DISPATCH SECTION */}
                <div className="rounded-xl p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      Live Delivery Test
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Send an instantaneous test verification email to confirm that your provider and credentials work before saving.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter your personal email (e.g. name@gmail.com)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isTesting || !testEmail}
                      onClick={handleSendTest}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Test Email
                        </>
                      )}
                    </button>
                  </div>

                  {testStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100/70 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{testStatus.msg}</span>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Configuration Saved Successfully!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
