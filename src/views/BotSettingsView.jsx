import React, { useState, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  Send,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { getBotInfo, updateBotMenuButton, sendTestMessage } from '../services/api';

export function BotSettingsView() {
  const [botInfo, setBotInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Menu button state
  const [menuUrl, setMenuUrl] = useState('');
  const [settingMenu, setSettingMenu] = useState(false);
  const [menuMsg, setMenuMsg] = useState(null);

  // Test notification state
  const [targetId, setTargetId] = useState('8401599473');
  const [testText, setTestText] = useState('👋 Hello Rotha! This is a test notification from your Mini Shop Bot (@minishopnuckbot).');
  const [sendingTest, setSendingTest] = useState(false);
  const [testMsg, setTestMsg] = useState(null);

  const loadBot = async () => {
    setLoading(true);
    try {
      const data = await getBotInfo();
      setBotInfo(data);
      if (data?.configured_mini_app_url) {
        setMenuUrl(data.configured_mini_app_url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBot();
  }, []);

  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    if (!menuUrl.startsWith('https://')) {
      alert('Telegram requires an HTTPS URL (e.g. via ngrok or Cloudflare tunnel) to configure WebApp buttons.');
      return;
    }
    setSettingMenu(true);
    setMenuMsg(null);
    try {
      await updateBotMenuButton(menuUrl);
      setMenuMsg({ type: 'success', text: 'Chat menu button updated on Telegram!' });
    } catch (err) {
      setMenuMsg({ type: 'error', text: err.message });
    } finally {
      setSettingMenu(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!targetId || !testText) return;
    setSendingTest(true);
    setTestMsg(null);
    try {
      await sendTestMessage(targetId, testText);
      setTestMsg({ type: 'success', text: `Message delivered to Telegram ID ${targetId}!` });
    } catch (err) {
      setTestMsg({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-extrabold text-white">Telegram Bot Integration</h1>
        <p className="text-xs text-slate-400">
          Manage @minishopnuckbot WebApp buttons and real-time alert triggers
        </p>
      </div>

      {/* Bot Status Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">
                  {botInfo?.bot_info?.first_name || 'minishopbot'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Online & Verified
                </span>
              </div>
              <p className="text-xs font-mono text-sky-400">
                @{botInfo?.bot_info?.username || 'minishopnuckbot'}
              </p>
            </div>
          </div>

          <a
            href={`https://t.me/${botInfo?.bot_info?.username || 'minishopnuckbot'}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <span>Open in Telegram</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[11px]">Bot ID</span>
            <span className="font-mono font-bold text-white">
              {botInfo?.bot_info?.id || '8704943227'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[11px]">Admin Telegram ID</span>
            <span className="font-mono font-bold text-indigo-300">
              {botInfo?.admin_id || '8401599473'} (Rotha)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block mb-1 text-[11px]">Background Worker</span>
            <span className="font-semibold text-emerald-400">Long-Polling Active</span>
          </div>
        </div>
      </div>

      {/* Set Chat Menu Button */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Configure WebApp Chat Menu Button</span>
        </div>
        <p className="text-xs text-slate-400">
          Set the persistent WebApp button in the bot chat window (e.g. "🛍 Open Shop"). Note that Telegram requires a secure <b>HTTPS</b> link.
        </p>

        <form onSubmit={handleUpdateMenu} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Public HTTPS WebApp URL
              </label>
              <button
                type="button"
                onClick={() => setMenuUrl('https://telegram-mini-app-user.vercel.app/')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-normal transition-colors cursor-pointer"
              >
                Use Production Mini App
              </button>
            </div>
            <input
              type="url"
              value={menuUrl}
              onChange={(e) => setMenuUrl(e.target.value)}
              placeholder="https://telegram-mini-app-user.vercel.app/"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              required
            />
          </div>

          {menuMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                menuMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800 text-rose-300'
              }`}
            >
              {menuMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{menuMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={settingMenu}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            {settingMenu ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Set Menu Button</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Test Live Message Dispatcher */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Send className="w-4 h-4 text-indigo-400" />
          <span>Test Live Telegram Alert</span>
        </div>
        <p className="text-xs text-slate-400">
          Send a direct test notification to verify that the bot can message your Telegram account instantly.
        </p>

        <form onSubmit={handleSendTest} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipient Telegram ID
              </label>
              <input
                type="number"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message Content
              </label>
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
          </div>

          {testMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testMsg.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800 text-rose-300'
              }`}
            >
              {testMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{testMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sendingTest}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingTest ? 'Sending...' : 'Send Live Test'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
