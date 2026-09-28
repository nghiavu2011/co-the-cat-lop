import { useState } from 'react';
import { trackDemographicPulse } from '../telemetry';

const SURVEY_DISMISSED_KEY = 'cotecatlop.survey_done';

export default function DemographicsSurvey() {
  const [closed, setClosed] = useState(() => {
    try {
      return localStorage.getItem(SURVEY_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [step, setStep] = useState<'role' | 'age' | 'thanks'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');

  if (closed) return null;

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    trackDemographicPulse(role, undefined);
    setStep('age');
  };

  const handleSelectAge = (age: string) => {
    trackDemographicPulse(selectedRole, age);
    setStep('thanks');
    try {
      localStorage.setItem(SURVEY_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      setClosed(true);
    }, 2500);
  };

  const handleDismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(SURVEY_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="demoSurveyBar">
      <div className="demoSurveyInner">
        {step === 'role' && (
          <>
            <span className="demoSurveyPrompt">
              👋 <b>Chào bạn!</b> Bạn đang khám phá giải phẫu với tư cách:
            </span>
            <div className="demoSurveyPills">
              <button className="demoPillBtn" onClick={() => handleSelectRole('Học sinh / Phổ thông')}>
                🎒 Học sinh / Phổ thông
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectRole('Sinh viên Y / Dược')}>
                🩺 Sinh viên Y / Dược
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectRole('Y Bác sĩ / Y tế')}>
                👨‍⚕️ Bác sĩ / Cán bộ Y tế
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectRole('Cộng đồng tìm hiểu')}>
                🌿 Tìm hiểu thường thức
              </button>
            </div>
          </>
        )}

        {step === 'age' && (
          <>
            <span className="demoSurveyPrompt">
              🎂 Độ tuổi của bạn (ẩn danh, hỗ trợ điều chỉnh góc nhìn phù hợp):
            </span>
            <div className="demoSurveyPills">
              <button className="demoPillBtn" onClick={() => handleSelectAge('< 18')}>
                Dưới 18
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectAge('18 - 24')}>
                18 - 24
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectAge('25 - 40')}>
                25 - 40
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectAge('41 - 60')}>
                41 - 60
              </button>
              <button className="demoPillBtn" onClick={() => handleSelectAge('> 60')}>
                Trên 60
              </button>
            </div>
          </>
        )}

        {step === 'thanks' && (
          <span className="demoSurveyPrompt" style={{ color: '#4caf50' }}>
            ✨ Cảm ơn bạn! N&Mstudio sẽ tối ưu bài giảng và góc nhìn giải phẫu tương ứng.
          </span>
        )}

        <button className="demoSurveyClose" onClick={handleDismiss} title="Đóng khảo sát">
          ✕
        </button>
      </div>
    </div>
  );
}
