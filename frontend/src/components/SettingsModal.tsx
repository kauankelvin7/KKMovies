import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings as SettingsIcon, Zap, Server, Trash2, Check, Globe, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { tmdbEmbedSettings, checkHealth, getProviders } from '../services/tmdbEmbedService';
import { PROVIDER_DISPLAY_NAMES } from '../types/tmdbEmbed';
import type { TMDBEmbedProvider, TMDBEmbedHealthResponse } from '../types/tmdbEmbed';

export const SettingsModal: React.FC = () => {
  const { settingsModal, closeSettings, addToast } = useAppStore();
  const { isOpen } = settingsModal;

  const [closing, setClosing] = useState(false);
  const [embedEnabled, setEmbedEnabled] = useState(false);
  const [embedBaseUrl, setEmbedBaseUrl] = useState('');
  const [healthStatus, setHealthStatus] = useState<TMDBEmbedHealthResponse | null>(null);
  const [providers, setProviders] = useState<TMDBEmbedProvider[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; message: string }>(null);

  /* Load saved settings on open */
  useEffect(() => {
    if (isOpen) {
      const settings = tmdbEmbedSettings.get();
      setEmbedEnabled(settings.enabled);
      setEmbedBaseUrl(settings.baseUrl);
      setHealthStatus(null);
      setProviders([]);
      setTestResult(null);
    }
  }, [isOpen]);

  /* Close with animation */
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      closeSettings();
    }, 300);
  }, [closeSettings]);

  /* Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Save TMDB Embed settings */
  const saveEmbedSettings = () => {
    const settings = tmdbEmbedSettings.set({
      enabled: embedEnabled,
      baseUrl: embedBaseUrl.trim(),
    });

    if (embedEnabled && !settings.baseUrl) {
      addToast('URL do TMDB Embed é obrigatória quando ativado', 'error');
      return;
    }

    addToast(
      embedEnabled
        ? 'TMDB Embed ativado — fontes nativas disponíveis no player'
        : 'Configurações salvas',
      'success'
    );
  };

  /* Test TMDB Embed connection */
  const testConnection = async () => {
    if (!embedBaseUrl.trim()) {
      setTestResult({ ok: false, message: 'Informe a URL da API primeiro' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setHealthStatus(null);
    setProviders([]);

    const saved = tmdbEmbedSettings.get();
    tmdbEmbedSettings.set({ enabled: true, baseUrl: embedBaseUrl.trim() });

    try {
      const [health, provs] = await Promise.all([
        checkHealth(),
        getProviders().catch(() => []),
      ]);

      setHealthStatus(health);
      setProviders(provs);

      const ok = health.available && health.status === 'ok';
      setTestResult({
        ok,
        message: ok
          ? `Conectado! ${provs.length} provedor(es) disponível(is)`
          : health.status === 'error'
            ? 'API não respondeu — verifique a URL ou se o servidor está online'
            : 'API online mas não configurada corretamente',
      });
    } catch {
      setTestResult({ ok: false, message: 'Erro de conexão — verifique a URL' });
    } finally {
      setTesting(false);
      tmdbEmbedSettings.set(saved);
    }
  };

  /* Clear cache */
  const clearAllCache = () => {
    try {
      const keys = Object.keys(localStorage).filter(
        (k) => k.startsWith('kf_cache_') || k.startsWith('kf_watch_') || k.startsWith('kf_search_')
      );
      keys.forEach((k) => localStorage.removeItem(k));
      addToast(`${keys.length} item(ns) de cache removido(s)`, 'success');
    } catch {
      addToast('Erro ao limpar cache', 'error');
    }
  };

  const resetAllSettings = () => {
    tmdbEmbedSettings.clear();
    setEmbedEnabled(false);
    setEmbedBaseUrl(import.meta.env.VITE_TMDB_EMBED_API_URL || 'http://localhost:8787');
    setHealthStatus(null);
    setProviders([]);
    setTestResult(null);
    addToast('Configurações restauradas', 'info');
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="details-modal-backdrop"
        onClick={handleClose}
      />

      <div className={`details-modal ${closing ? 'closing' : ''}`}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 btn-icon w-10 h-10"
          aria-label="Fechar"
          style={{ background: 'rgba(13,13,20,0.9)' }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative w-full" style={{ height: '32vh', minHeight: 200 }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(142,111,214,0.22) 0%, rgba(10,132,255,0.12) 50%, rgba(5,5,8,1) 100%)',
            }}
          />
          <div
            className="absolute inset-0 flex flex-col justify-end"
            style={{ padding: '0 clamp(16px, 5vw, 80px) 32px' }}
          >
            <div
              className="flex items-center gap-3 mb-3"
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(142,111,214,0.18)',
                border: '0.5px solid rgba(142,111,214,0.35)',
              }}
            >
              <SettingsIcon className="w-7 h-7 mx-auto" style={{ color: '#8E6FD6' }} />
            </div>
            <h1
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 300,
                fontSize: 'clamp(24px, 3vw, 38px)',
                lineHeight: 1.1,
              }}
            >
              Configurações
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Personalize sua experiência do KKMovies
            </p>
          </div>
        </div>

        <div style={{ padding: '24px clamp(16px, 5vw, 80px) 60px', minHeight: 400 }}>
          <div className="space-y-8">

            {/* ── Section: TMDB Embed API ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,204,0,0.1)', border: '0.5px solid rgba(255,204,0,0.25)' }}
                >
                  <Zap className="w-4 h-4" style={{ color: '#FFCC00' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 500 }}>
                    TMDB Embed API
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Player nativo com 13+ fontes diretas, sem iframe
                  </p>
                </div>
              </div>

              <div className="glass-card p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                      Ativar TMDB Embed
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Quando ativado, o player usará fontes nativas como alternativa ao SuperFlix
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmbedEnabled(!embedEnabled)}
                    className="relative flex-shrink-0"
                    style={{
                      width: 51, height: 31, borderRadius: 999,
                      background: embedEnabled ? '#34C759' : 'rgba(120,120,128,0.32)',
                      transition: 'background 0.2s ease',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={embedEnabled ? 'Desativar' : 'Ativar'}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: embedEnabled ? 22 : 2,
                        width: 27, height: 27,
                        borderRadius: 999,
                        background: '#fff',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06)',
                        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                    URL da API
                  </label>
                  <div className="flex gap-2">
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Globe
                        className="w-4 h-4 absolute"
                        style={{
                          left: 14, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                        }}
                      />
                      <input
                        type="url"
                        value={embedBaseUrl}
                        onChange={(e) => setEmbedBaseUrl(e.target.value)}
                        placeholder="https://sua-api.exemplo.com"
                        spellCheck={false}
                        className="w-full"
                        style={{
                          height: 44,
                          paddingLeft: 40,
                          paddingRight: 14,
                          borderRadius: 12,
                          background: 'var(--surface-2)',
                          border: '0.5px solid var(--border-default)',
                          color: 'var(--text-primary)',
                          fontSize: 14,
                          outline: 'none',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-blue)';
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(142,111,214,0.15)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={testing}
                      className="glass-button"
                      style={{ minWidth: 120 }}
                    >
                      {testing ? (
                        <>
                          <div
                            className="w-4 h-4 rounded-full border-2 animate-spin"
                            style={{ borderColor: 'transparent', borderTopColor: 'currentColor' }}
                          />
                          Testando...
                        </>
                      ) : (
                        <>
                          <Server className="w-4 h-4" />
                          Testar
                        </>
                      )}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 6, lineHeight: 1.5 }}>
                    Deixe vazio para usar o valor padrão. Deploy da API:{' '}
                    <a
                      href="https://github.com/typical-GO/tmdb-embed-api"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}
                    >
                      github.com/typical-GO/tmdb-embed-api
                    </a>
                  </p>
                </div>

                {testResult && (
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{
                      background: testResult.ok ? 'rgba(52,199,89,0.08)' : 'rgba(255,149,0,0.08)',
                      border: `0.5px solid ${testResult.ok ? 'rgba(52,199,89,0.3)' : 'rgba(255,149,0,0.3)'}`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: testResult.ok ? 'rgba(52,199,89,0.18)' : 'rgba(255,149,0,0.18)' }}
                    >
                      {testResult.ok
                        ? <Check className="w-4 h-4" style={{ color: '#34C759' }} />
                        : <Info className="w-4 h-4" style={{ color: '#FF9500' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>
                        {testResult.ok ? 'Conexão bem-sucedida' : 'Atenção'}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                        {testResult.message}
                      </p>
                      {healthStatus && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-2 py-1 rounded-md text-[11px]"
                            style={{
                              background: healthStatus.status === 'ok' ? 'rgba(52,199,89,0.15)' : 'rgba(255,149,0,0.15)',
                              color: healthStatus.status === 'ok' ? '#34C759' : '#FF9500',
                            }}>
                            status: {healthStatus.status}
                          </span>
                          {healthStatus.uptime !== undefined && (
                            <span className="px-2 py-1 rounded-md text-[11px]"
                              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                              uptime: {Math.floor(healthStatus.uptime / 60000)}min
                            </span>
                          )}
                          {healthStatus.version && (
                            <span className="px-2 py-1 rounded-md text-[11px]"
                              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                              v{healthStatus.version}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {providers.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 10, color: 'var(--text-muted)' }}>
                      Provedores disponíveis
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {providers.map((p) => (
                        <span
                          key={p.name}
                          className="px-3 py-1.5 rounded-full text-[11.5px] flex items-center gap-1.5"
                          style={{
                            background: p.enabled ? 'rgba(52,199,89,0.1)' : 'rgba(142,142,147,0.12)',
                            border: `0.5px solid ${p.enabled ? 'rgba(52,199,89,0.25)' : 'rgba(142,142,147,0.2)'}`,
                            color: p.enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: p.enabled ? '#34C759' : '#8E8E93' }}
                          />
                          {p.displayName || PROVIDER_DISPLAY_NAMES[p.name] || p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { saveEmbedSettings(); handleClose(); }}
                    className="glass-button primary flex-1"
                    style={{ minHeight: 44 }}
                  >
                    <Check className="w-4 h-4" />
                    Salvar configurações
                  </button>
                  <button
                    type="button"
                    onClick={resetAllSettings}
                    className="glass-button"
                    style={{ minHeight: 44 }}
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            </section>

            {/* ── Section: Dados ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,59,48,0.1)', border: '0.5px solid rgba(255,59,48,0.25)' }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#FF3B30' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 500 }}>
                    Dados e Cache
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Gerencie dados armazenados localmente
                  </p>
                </div>
              </div>

              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                      Limpar cache da sessão
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Remove buscas, detalhes e listas cacheadas (histórico de visualização é preservado)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllCache}
                    className="glass-button"
                    style={{ minHeight: 40 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar
                  </button>
                </div>
              </div>
            </section>

            {/* ── Section: Sobre ── */}
            <section>
              <div className="glass-card p-5 text-center">
                <div className="mb-3">
                  <span
                    className="ios-nav-logo-text"
                    style={{ fontSize: 20 }}
                  >
                    KKMovies
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Versão 1.0.0 · Feito com ❤️ para cinéfilos
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 6 }}>
                  Dados de TMDB · Fontes de terceiros · Todos os direitos aos respectivos donos
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>,
    document.getElementById('portal-root') || document.body
  );
};
