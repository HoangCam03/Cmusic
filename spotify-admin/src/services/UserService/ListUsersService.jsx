import { toast } from 'react-toastify';

export const listUsers = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken'); // Assuming token is needed
    if (!accessToken) {
      // In a real app, you might redirect to login or throw a specific auth error
      const error = new Error('Authentication token not found. Please log in.');
      error.status = 401;
      throw error;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/user/list`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json' // Good practice even for GET if expecting JSON errors
      }
    });

    const data = await response.json();

    if (!response.ok) {
        // Handle API errors based on status code or message
        const error = new Error(data.message || `API error: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    if (data.status === "Success") {
      return data.users; // Return the array of users
    } else {
      // Handle cases where status is not 'Success' but response is still OK (less common)
       const error = new Error(data.message || 'API returned unsuccessful status');
       error.status = response.status; // Still use the HTTP status
       throw error;
    }

  } catch (error) {
    console.error("Error in listUsers service:", error);
    // Re-throw the error to be caught by the component or caller
    throw error;
  }
}; 