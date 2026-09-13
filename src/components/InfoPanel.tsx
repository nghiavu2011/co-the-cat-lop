import { NOTE_BY_ID } from '../content/notes';
import { MATCH_3D } from '../content/match3d';
import { SYSTEM_BY_ID, defaultSystemFor } from '../data/systems';
import { buildBinding } from '../data/bind';
import { PHYSICAL_MECHANISMS, BODY_INSIGHTS } from '../content/insights';
import { getAnatomicalInsight } from '../content/anatomyDict';
import { NOTE_TO_ORGAN, ORGAN_BY_ID } from '../organs/organData';
import type { AtlasJSON } from '../data/types';
import type { Selection } from '../selection';

export interface InfoPanelProps {
  selection: Selection | null;
  atlas: AtlasJSON | null;
  mode: '2d' | '3d';
  onOpenDetail?: () => void;
}

function Intro() {
  return (
    <div className="intro">
      <h2>Đọc cơ thể mình như đọc một tấm phim</h2>
      <p>
        Trang này ghép hai cách nhìn quen thuộc trong y khoa: <em>bóc lớp</em> như tấm bản vẽ giải phẫu, và{' '}
        <em>cắt lát</em> bằng chính mô hình giải phẫu ba chiều thật của BodyParts3D — 2.234 cấu trúc.
      </p>
      <ol>
        <li>
          Kéo thanh <b>Độ sâu bóc lớp</b> để lần lượt gỡ da, mỡ, cơ, xương và thấy nội tạng bên dưới.
        </li>
        <li>Chọn một hệ cơ quan ở cột trái hoặc bấm vào thẻ <b>Giải mã</b> để tìm hiểu các hiện tượng đời thường.</li>
        <li>Bấm vào bất kỳ bộ phận trên hình để đọc chú thích ở đúng ô này.</li>
        <li>
          Sang tab <b>Cắt lát 3D</b> để xoay mô hình thật và trượt mặt phẳng cắt qua từng vùng — kể cả những cấu
          trúc chưa có chú thích riêng.
        </li>
      </ol>
    </div>
  );
}

function RawPartCard({ partId, atlas }: { partId: string; atlas: AtlasJSON | null }) {
  const part = atlas?.parts.find((p) => p.id === partId);
  if (!part) return null;
  const concept = atlas?.concepts.find((c) => c.id === part.conceptId);
  const sys = SYSTEM_BY_ID[defaultSystemFor(part)];
  const insight = getAnatomicalInsight(part.name, sys.name, concept?.name);

  return (
    <>
      <div className="pcap">
        <span className="sys">
          <span className="dot" style={{ background: `var(${sys.color})`, display: 'inline-block', width: 9, height: 9, borderRadius: 2 }} />
          {sys.name} · Cấu trúc giải phẫu 3D thật
        </span>
        <h2>{insight.viName || part.name}</h2>
        <div className="en">
          {part.name} {concept && concept.name !== part.name ? `(${concept.name})` : ''} · Mã: {part.conceptId}
        </div>
      </div>
      <div className="pbody">
        <div className="fld mech">
          <div className="mechHead">
            <span className="mechBadge">🏷️ Phân loại</span>
            <span className="mechRole">{insight.category}</span>
          </div>
          <p className="mechPrinciple">{insight.function}</p>
        </div>

        <div className="fld">
          <h3>Vị trí giải phẫu</h3>
          <p>{insight.location}</p>
        </div>

        <div className="fld">
          <h3>Chức năng sinh lý học</h3>
          <p>{insight.function}</p>
        </div>

        <div className="fld care">
          <h3>Lưu ý lâm sàng & sức khỏe</h3>
          <p>{insight.clinicalNote}</p>
        </div>

        <div className="fld num">
          <h3>Dữ liệu hình học 3D thật</h3>
          <p>
            Mã định danh: <b>{part.id}</b> · Số đỉnh: <b>{part.vertexCount.toLocaleString('vi-VN')}</b> · Hệ: <b>{sys.name}</b> ·
            Tọa độ quét gốc BodyParts3D từ Đại học Tokyo.
          </p>
        </div>
      </div>
    </>
  );
}

export default function InfoPanel({ selection, atlas, mode, onOpenDetail }: InfoPanelProps) {
  if (!selection) return <Intro />;
  if (selection.kind === 'part') return <RawPartCard partId={selection.id} atlas={atlas} />;

  const note = NOTE_BY_ID[selection.id];
  if (!note) return <Intro />;
  const sys = SYSTEM_BY_ID[note.s];
  const layerName = ['Da', 'Mỡ dưới da', 'Cơ', 'Xương', 'Nội tạng', 'Mạch máu & thần kinh'][note.l];
  const spec = MATCH_3D[note.i];
  const meshCount = atlas && spec ? buildBinding(atlas).noteToParts.get(note.i)?.length ?? 0 : 0;
  const mech = PHYSICAL_MECHANISMS[note.i];
  const matchingInsights = BODY_INSIGHTS.filter((ins) => ins.noteId === note.i);

  return (
    <>
      <div className="pcap">
        <span className="sys">
          <span className="dot" style={{ background: `var(${sys.color})`, display: 'inline-block', width: 9, height: 9, borderRadius: 2 }} />
          {sys.name} · lớp {layerName}
        </span>
        <h2>{note.n}</h2>
        <div className="en">{note.e}</div>
        {onOpenDetail && note.i in NOTE_TO_ORGAN && (
          <button
            type="button"
            className="organDetailCta"
            onClick={onOpenDetail}
          >
            ✨ Xem mô hình 3D chi tiết & Vi thể ({ORGAN_BY_ID[NOTE_TO_ORGAN[note.i]]?.name})
          </button>
        )}
      </div>
      <div className="pbody">
        {mech && (
          <div className="fld mech">
            <div className="mechHead">
              <span className="mechBadge">⚙️ Cơ chế vật lý</span>
              <span className="mechRole">{mech.role}</span>
            </div>
            <p className="mechPrinciple">{mech.principle}</p>
          </div>
        )}

        <div className="fld">
          <h3>Nằm ở đâu</h3>
          <p>{note.vt}</p>
        </div>
        <div className="fld">
          <h3>Làm việc gì</h3>
          <p>{note.cn}</p>
        </div>
        <div className="fld num">
          <h3>Con số đáng nhớ</h3>
          <p>{note.sl}</p>
        </div>
        <div className="fld">
          <h3>Dấu hiệu bất thường</h3>
          <p>{note.dh}</p>
        </div>

        {matchingInsights.length > 0 && (
          <div className="fld insightCard">
            <h3>💡 Giải mã hiện tượng thường nhật</h3>
            {matchingInsights.map((ins) => (
              <div key={ins.id} className="insightItem">
                <div className="insightQ">{ins.question}</div>
                <p className="insightMech">{ins.mechanism}</p>
                <div className="insightTip">
                  <b>Lời khuyên:</b> {ins.tip}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fld care">
          <h3>Điều nên lưu ý</h3>
          <p>{note.gg}</p>
        </div>
        {!spec && (
          <div className="no3d">
            Bộ phận này chưa có mesh trong BodyParts3D 4.0 (bộ dữ liệu không bao gồm mọi cấu trúc). Xem ở chế độ
            bóc lớp 2D.
          </div>
        )}
        {spec && mode === '3d' && meshCount > 0 && (
          <div className="meshcount">
            <b>{meshCount}</b> cấu trúc thật của BodyParts3D được ghép vào mục này
          </div>
        )}
      </div>
    </>
  );
}
