import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import "./AuthModal.css";

const COPY = {
  en: {
    signUp: "Sign Up",
    signIn: "Sign In",
    name: "Name",
    email: "Email",
    password: "Password",
    parentEmail: "Parent's Email (Optional)",
    iAmA: "I am a…",
    student: "Student",
    teacher: "Teacher",
    parent: "Parent",
    register: "Register",
    login: "Login",
    haveAccount: "Already have an account?",
    noAccount: "Don’t have an account?",
    close: "Close",
    showPassword: "Show password",
    hidePassword: "Hide password",
    success: "🎉 Success! Redirecting...",
    errors: {
      nameRequired: "Name is required.",
      nameNumbers: "Name cannot contain numbers.",
      email: "Invalid email address.",
      password: "Password must be at least 6 characters.",
      parentEmail: "Invalid parent email address.",
      generic: "Authentication failed. Please try again.",
      unexpected: "Unexpected error. Please try again."
    }
  },
  ar: {
    signUp: "إنشاء حساب",
    signIn: "تسجيل الدخول",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    parentEmail: "بريد ولي الأمر (اختياري)",
    iAmA: "أنا…",
    student: "طالب",
    teacher: "معلم",
    parent: "ولي أمر",
    register: "تسجيل",
    login: "دخول",
    haveAccount: "هل لديك حساب؟",
    noAccount: "ليس لديك حساب؟",
    close: "إغلاق",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    success: "🎉 تم بنجاح! جارٍ التحويل...",
    errors: {
      nameRequired: "الاسم مطلوب.",
      nameNumbers: "لا يمكن أن يحتوي الاسم على أرقام.",
      email: "البريد الإلكتروني غير صالح.",
      password: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      parentEmail: "بريد ولي الأمر غير صالح.",
      generic: "فشل تسجيل الدخول. حاول مرة أخرى.",
      unexpected: "حدث خطأ غير متوقع. حاول مرة أخرى."
    }
  }
};

// Messages returned by App.js's auth handlers, translated for Arabic sessions
const SERVER_MESSAGES_AR = {
  "Invalid email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "This email is already registered.": "هذا البريد الإلكتروني مسجل بالفعل.",
  "Failed to initialize parent account.": "تعذر إنشاء حساب ولي الأمر.",
  "Failed to initialize teacher account.": "تعذر إنشاء حساب المعلم."
};

const ROLES = [
  { id: "student", icon: "🎒" },
  { id: "teacher", icon: "🧑‍🏫" },
  { id: "parent", icon: "👪" }
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthModal({ lang, mode, setMode, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [parentEmail, setParentEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = COPY[lang] || COPY.en;
  const isSignup = mode === "signup";

  // Escape closes the dialog
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const validate = () => {
    const newErrors = {};
    if (isSignup && !name.trim()) newErrors.name = t.errors.nameRequired;
    else if (isSignup && /\d/.test(name)) newErrors.name = t.errors.nameNumbers;
    if (!EMAIL_RE.test(email)) newErrors.email = t.errors.email;
    if (password.length < 6) newErrors.password = t.errors.password;

    // Validate parent email for student accounts
    if (isSignup && role === "student" && parentEmail && !EMAIL_RE.test(parentEmail)) {
      newErrors.parentEmail = t.errors.parentEmail;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (isSubmitting || !validate()) return;
    setServerError("");
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await onSubmit(mode, { name, email, password, role, parentEmail });
      if (res && res.ok) {
        setSuccess(t.success);
        setTimeout(() => onClose(), 900); // close modal -> App shows main UI
      } else {
        const message = res?.message || t.errors.generic;
        setServerError(lang === "ar" ? SERVER_MESSAGES_AR[message] || message : message);
        setIsSubmitting(false);
      }
    } catch (e) {
      setServerError(t.errors.unexpected);
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setServerError("");
    setSuccess(null);
    setErrors({});
    setMode(isSignup ? "signin" : "signup");
  };

  const textVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  const field = (key, props) => (
    <AnimatePresence mode="wait">
      <motion.input
        key={lang + "-" + key + mode}
        className="modal-input"
        variants={textVariants}
        initial="enter"
        animate="center"
        exit="exit"
        aria-invalid={Boolean(errors[key])}
        {...props}
      />
    </AnimatePresence>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        dir={lang === "ar" ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label={t.close}>×</button>

        <h2 id="auth-modal-title">{isSignup ? t.signUp : t.signIn}</h2>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <>
              {field("name", {
                type: "text",
                value: name,
                placeholder: t.name,
                "aria-label": t.name,
                autoComplete: "name",
                onChange: (e) => setName(e.target.value)
              })}
              {errors.name && <div className="error-text" role="alert">{errors.name}</div>}
            </>
          )}

          {field("email", {
            type: "email",
            value: email,
            placeholder: t.email,
            "aria-label": t.email,
            autoComplete: "email",
            inputMode: "email",
            dir: "ltr",
            onChange: (e) => setEmail(e.target.value)
          })}
          {errors.email && <div className="error-text" role="alert">{errors.email}</div>}

          <div className="auth-password">
            {field("password", {
              type: showPassword ? "text" : "password",
              value: password,
              placeholder: t.password,
              "aria-label": t.password,
              autoComplete: isSignup ? "new-password" : "current-password",
              onChange: (e) => setPassword(e.target.value)
            })}
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
          {errors.password && <div className="error-text" role="alert">{errors.password}</div>}

          {isSignup && (
            <fieldset className="auth-roles">
              <legend>{t.iAmA}</legend>
              <div className="auth-roles-options">
                {ROLES.map(option => (
                  <label key={option.id} className={`auth-role ${role === option.id ? "is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="role"
                      value={option.id}
                      checked={role === option.id}
                      onChange={() => setRole(option.id)}
                    />
                    <span className="auth-role-icon" aria-hidden="true">{option.icon}</span>
                    <span className="auth-role-label">{t[option.id]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {isSignup && role === "student" && (
            <>
              {field("parentEmail", {
                type: "email",
                value: parentEmail,
                placeholder: t.parentEmail,
                "aria-label": t.parentEmail,
                autoComplete: "off",
                inputMode: "email",
                dir: "ltr",
                onChange: (e) => setParentEmail(e.target.value)
              })}
              {errors.parentEmail && <div className="error-text" role="alert">{errors.parentEmail}</div>}
            </>
          )}

          {success && <div className="success-message success" role="status">{success}</div>}
          {serverError && <div className="success-message error" role="alert">{serverError}</div>}

          <button type="submit" className="modal-submit" disabled={isSubmitting}>
            {isSignup ? t.register : t.login}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? t.haveAccount : t.noAccount}{" "}
          <button type="button" className="auth-switch-btn" onClick={switchMode}>
            {isSignup ? t.signIn : t.signUp}
          </button>
        </div>
      </div>
    </div>
  );
}
