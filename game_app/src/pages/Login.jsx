"use client"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./Auth.css"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
})

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Monopoly Game</h1>
        <h2>Login</h2>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await login(values.email, values.password)
              navigate("/dashboard")
            } catch (err) {
              console.error(err.response?.data?.error || "Login failed")
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label>Email</label>
                <Field type="email" name="email" placeholder="your@email.com" className="form-input" />
                <ErrorMessage name="email" component="div" className="error-text" />
              </div>

              <div className="form-group">
                <label>Password</label>
                <Field type="password" name="password" placeholder="••••••••" className="form-input" />
                <ErrorMessage name="password" component="div" className="error-text" />
              </div>

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="divider">OR</div>

        <div className="social-buttons">
          <button className="btn-social btn-google" onClick={() => handleSocialLogin("google")}>
            Continue with Google
          </button>
          <button className="btn-social btn-github" onClick={() => handleSocialLogin("github")}>
            Continue with GitHub
          </button>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
