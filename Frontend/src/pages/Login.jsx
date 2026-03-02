import { useState } from "react";
import "./Login.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    // console.log("name --->", name);
    // console.log("value --->", value);
    setForm((prev) => {
      return { ...prev, [name]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    console.log("form --->", form);

    // api call to backend for authentication
    axios
      .post(
        "http://localhost:3000/api/auth/login",
        {
          email: form.email,
          password: form.password,
        },
        {
          withCredentials: true, // important for sending cookies
        },
      )
      .then((response) => {
        console.log("Login successful (response):", response);
        console.log("Login successful (response.data):", response.data);

        // redirect to home page or dashboard after successful login
        navigate("/");
      })
      .catch((error) => {
        console.error("Login failed:", error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          // value={form.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          // value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
        <p className="switch-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
