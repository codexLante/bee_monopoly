"use client"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./Auth.css"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .required("Username is required"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
})

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Monopoly Game</h1>
        <h2>Register</h2>

        <Formik
          initialValues={{ username: "", email: "", password: "" }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await register(values.username, values.email, values.password)
              navigate("/dashboard")
            } catch (err) {
              setSubmitting(false)
              alert(err.response?.data?.error || "Registration failed")
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label>Username</label>
                <Field type="text" name="username" placeholder="Your name" className="form-input" />
                <ErrorMessage name="username" component="div" className="error-text" />
              </div>

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
                {isSubmitting ? "Creating account..." : "Register"}
              </button>
            </Form>
          )}
        </Formik>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
