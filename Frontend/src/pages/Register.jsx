import React, { useState } from "react";
import "./Register.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    email: "",
    firstname: "",
    lastname: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      return { ...prev, [name]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // console.log("form --->", form);

    // api call to backend for registration
    axios
      .post(
        "http://localhost:3000/api/auth/register",
        {
          email: form.email,
          fullName: {
            firstName: form.firstname,
            lastName: form.lastname,
          },
          password: form.password,
        },
        {
          withCredentials: true, // important for sending cookies
        },
      )
      .then((response) => {
        // console.log("Registration successful (response):", response);
        console.log("Registration successful (response.data):", response.data);

        // redirect to login page after successful registration
        navigate("/");
      })
      .catch((error) => {
        console.error("Registration failed:", error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h1>Sign up</h1>

        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          // value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <div className="name-fields">
          <div className="field">
            <label htmlFor="firstname">First Name</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              placeholder="John"
              // value={form.firstname}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="lastname">Last Name</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              // value={form.lastname}
              placeholder="Doe"
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="*******"
          // value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Registering..." : "Register"}
        </button>
        <p className="switch-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
