// import React, { useRef } from 'react';
// import { useNavigate } from "react-router-dom";

// const Login = () => {
//   const navigate = useNavigate();
//   const usernameRef = useRef(null);
//   const passwordRef = useRef(null);

//   const handleLogin = () => {
//     navigate("/dashboard");
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       handleLogin();
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-blue-100">
//       <div className="bg-white p-6 rounded shadow-md w-80">
//         <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Login</h2>
//         <input
//           type="text"
//           placeholder="Username"
//           className="w-full mb-3 p-2 border rounded"
//           ref={usernameRef}
//           onKeyDown={handleKeyDown}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full mb-4 p-2 border rounded"
//           ref={passwordRef}
//           onKeyDown={handleKeyDown}
//         />
//         <button
//           onClick={handleLogin}
//           className="w-full bg-blue-600 text-white py-2 rounded cursor-pointer"
//         >
//           Login
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "./config";

const Login = () => {
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const username = usernameRef.current.value.trim();
    const password = passwordRef.current.value;

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/User/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        if (data.role) {
          // Store everything in one key
          const userObj = {
            name: data.username, // don't lower-case now, for display
            role: data.role,
            token: data.token,
          };
          localStorage.setItem("currentUser", JSON.stringify(userObj));
        }

        navigate("/dashboard/project-budget-status");
      } else {
        // Check the Content-Type to determine how to parse the response
        const contentType = response.headers.get("content-type");
        let errorMessage = "Login failed. Please check your credentials.";

        if (contentType && contentType.includes("application/json")) {
          // Response is JSON
          try {
            const errData = await response.json();
            errorMessage =
              errData.message ||
              errData.error ||
              errData.Message ||
              errData.Error ||
              errorMessage;
          } catch (jsonError) {
            errorMessage = "Login failed. Please check your credentials.";
          }
        } else {
          // Response is plain text (like in your case)
          try {
            const textResponse = await response.text();
            errorMessage = textResponse || errorMessage;
          } catch (textError) {
            errorMessage = "Login failed. Please check your credentials.";
          }
        }

        setError(errorMessage);
      }
    } catch (error) {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <div className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
          Login
        </h2>
        {error && (
          <div className="mb-3 text-red-600 text-center text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ref={usernameRef}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ref={passwordRef}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleLogin}
          className={`w-full py-2 rounded font-medium text-white transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }`}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default Login;
