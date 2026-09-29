import { NOTE_BY_ID } from '../content/notes';
import { MATCH_3D } from '../content/match3d';
import { SYSTEM_BY_ID, defaultSystemFor } from '../data/systems';
import { buildBinding } from '../data/bind';
import { PHYSICAL_MECHANISMS, BODY_INSIGHTS } from '../content/insights';
import { getAnatomicalInsight } from '../content/anatomyDict';
import { NOTE_TO_ORGAN, ORGAN_BY_ID } from '../organs/organData';
import { useLocale } from '../locale/useLocale';
import type { AtlasJSON } from '../data/types';
import type { Selection } from '../selection';

export interface InfoPanelProps {
  selection: Selection | null;
  atlas: AtlasJSON | null;
  mode: '2d' | '3d';
  onOpenDetail?: () => void;
  onClose?: () => void;
}

function Intro() {
  const { t } = useLocale();

  return (
    <div className="intro">
      <h2>{t('info.introTitle')}</h2>
      <p>
        Trang này ghép hai cách nhìn quen thuộc trong y khoa: <em>bóc lớp</em> như tấm bản vẽ giải phẫu, và{' '}
        <em>cắt lát</em> bằng chính mô hình giải phẫu ba chiều thật của BodyParts3D — 2.234 cấu trúc.
      </p>
      <ol>
        <li>Kéo thanh <b>Bóc tách lớp</b> bên trái để lần lượt bóc da, mỡ, cơ, xương và thấy nội tạng bên dưới.</li>
        <li>Bấm vào bất kỳ khối cấu trúc 3D trên màn hình để xem hồ sơ giải phẫu học và dùng bộ công cụ Ẩn / Mờ / Cô lập.</li>
        <li>Kéo thanh trượt bên dưới để cắt lát không gian theo các trục kinh điển (Axial, Coronal, Sagittal).</li>
      </ol>
    </div>
  );
}

function RawPartCard({
  partId,
  atlas,
  onClose,
}: {
  partId: string;
  atlas: AtlasJSON | null;
  onClose?: () => void;
}) {
  const { t, locale } = useLocale();
  const part = atlas?.parts.find((p) => p.id === partId);
  if (!part) return null;
  const concept = atlas?.concepts.find((c) => c.id === part.conceptId);
  const sys = SYSTEM_BY_ID[defaultSystemFor(part)];
  const insight = getAnatomicalInsight(part.name, sys.name, concept?.name);

  return (
    <>
      <div className="pcap">
        <div className="pcapTopRow">
          <span className="sys">
            <span
              className="dot"
              style={{
                background: `var(${sys.color})`,
                display: 'inline-block',
                width: 9,
                height: 9,
                borderRadius: 2,
              }}
            />
            {sys.name} · {locale === 'en' ? 'Biometric 3D Mesh' : 'Cấu trúc giải phẫu 3D thật'}
          </span>
          {onClose && (
            <button
              type="button"
              className="pcapCloseBtn"
              onClick={onClose}
              title={t('info.close')}
              aria-label={t('info.close')}
            >
              ✕
            </button>
          )}
        </div>
        <h2>{locale === 'en' ? part.name : insight.viName || part.name}</h2>
        <div className="en">
          {locale === 'en' ? (insight.viName ? `VN: ${insight.viName}` : '') : part.name}{' '}
          {concept && concept.name !== part.name ? `(${concept.name})` : ''} · ID: {part.conceptId}
        </div>
      </div>
      <div className="pbody">
        <div className="fld mech">
          <div className="mechHead">
            <span className="mechBadge">🏷️ {t('info.category')}</span>
            <span className="mechRole">{insight.category}</span>
          </div>
          <p className="mechPrinciple">{insight.function}</p>
        </div>

        <div className="fld">
          <h3>{t('info.location')}</h3>
          <p>{insight.location}</p>
        </div>

        <div className="fld">
          <h3>{t('info.function')}</h3>
          <p>{insight.function}</p>
        </div>

        <div className="fld care">
          <h3>{t('info.clinicalNote')}</h3>
          <p>{insight.clinicalNote}</p>
        </div>

        <div className="fld num">
          <h3>{t('info.geoData')}</h3>
          <p>
            ID: <b>{part.id}</b> · Vertices: <b>{part.vertexCount.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}</b> · System: <b>{sys.name}</b>
          </p>
        </div>
      </div>
    </>
  );
}

export default function InfoPanel({ selection, atlas, mode, onOpenDetail, onClose }: InfoPanelProps) {
  const { t, locale } = useLocale();

  if (!selection) return <Intro />;
  if (selection.kind === 'part') return <RawPartCard partId={selection.id} atlas={atlas} onClose={onClose} />;

  const note = NOTE_BY_ID[selection.id];
  if (!note) return <Intro />;
  const sys = SYSTEM_BY_ID[note.s];
  const layerNamesVi = ['Da', 'Mỡ dưới da', 'Cơ', 'Xương', 'Nội tạng', 'Mạch máu & thần kinh'];
  const layerNamesEn = ['Skin', 'Subcutaneous Fat', 'Muscles', 'Skeletal', 'Organs', 'Vessels & Nerves'];
  const layerName = locale === 'en' ? layerNamesEn[note.l] : layerNamesVi[note.l];
  const spec = MATCH_3D[note.i];
  const meshCount = atlas && spec ? buildBinding(atlas).noteToParts.get(note.i)?.length ?? 0 : 0;
  const mech = PHYSICAL_MECHANISMS[note.i];
  const matchingInsights = BODY_INSIGHTS.filter((ins) => ins.noteId === note.i);

  return (
    <>
      <div className="pcap">
        <div className="pcapTopRow">
          <span className="sys">
            <span
              className="dot"
              style={{
                background: `var(${sys.color})`,
                display: 'inline-block',
                width: 9,
                height: 9,
                borderRadius: 2,
              }}
            />
            {sys.name} · {locale === 'en' ? `Layer: ${layerName}` : `Lớp: ${layerName}`}
          </span>
          {onClose && (
            <button
              type="button"
              className="pcapCloseBtn"
              onClick={onClose}
              title={t('info.close')}
              aria-label={t('info.close')}
            >
              ✕
            </button>
          )}
        </div>

        <h2>{locale === 'en' ? note.e : note.n}</h2>
        <div className="en">{locale === 'en' ? `VN: ${note.n}` : note.e}</div>

        {onOpenDetail && note.i in NOTE_TO_ORGAN && (
          <button type="button" className="organDetailCta" onClick={onOpenDetail}>
            {t('info.viewOrgan')} ({ORGAN_BY_ID[NOTE_TO_ORGAN[note.i]]?.name})
          </button>
        )}
      </div>

      <div className="pbody">
        {mech && (
          <div className="fld mech">
            <div className="mechHead">
              <span className="mechBadge">{t('info.mechanism')}</span>
              <span className="mechRole">{mech.role}</span>
            </div>
            <p className="mechPrinciple">{mech.principle}</p>
          </div>
        )}

        <div className="fld">
          <h3>{t('info.location')}</h3>
          <p>{note.vt}</p>
        </div>

        <div className="fld">
          <h3>{t('info.function')}</h3>
          <p>{note.cn}</p>
        </div>

        <div className="fld num">
          <h3>{t('info.stats')}</h3>
          <p>{note.sl}</p>
        </div>

        <div className="fld">
          <h3>{t('info.symptoms')}</h3>
          <p>{note.dh}</p>
        </div>

        {matchingInsights.length > 0 && (
          <div className="fld insightCard">
            <h3>{t('info.insightTitle')}</h3>
            {matchingInsights.map((ins) => (
              <div key={ins.id} className="insightItem">
                <div className="insightQ">{ins.question}</div>
                <p className="insightMech">{ins.mechanism}</p>
                <div className="insightTip">
                  <b>{t('info.tip')}:</b> {ins.tip}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fld care">
          <h3>{t('info.advice')}</h3>
          <p>{note.gg}</p>
        </div>

        {!spec && <div className="no3d">{t('info.noMesh')}</div>}

        {spec && mode === '3d' && meshCount > 0 && (
          <div className="meshcount">
            <b>{meshCount}</b> {t('info.meshCount')}
          </div>
        )}
      </div>
    </>
  );
}
