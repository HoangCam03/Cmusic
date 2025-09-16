
export const userLoginService = async(identifier, password) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle API errors (e.g., invalid credentials)
            const error = new Error(data.message || 'Login failed');
            error.status = response.status;
            throw error;
        }

        // Return success data (user, tokens)
        return data;

    } catch (error) {
        console.error("Login API error:", error);
        throw error; // Re-throw to be handled by the component
    }
};