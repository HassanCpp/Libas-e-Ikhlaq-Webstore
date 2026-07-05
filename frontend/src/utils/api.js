const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getHeaders = (isFormData = false) => {
    const headers = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (res) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
        return res.blob();
    }

    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = { message: 'Invalid server response format.' };
    }

    if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const api = {
    get: async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(res);
    },
    post: async (path, body) => {
        const isFormData = body instanceof FormData;
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: getHeaders(isFormData),
            body: isFormData ? body : JSON.stringify(body)
        });
        return handleResponse(res);
    },
    put: async (path, body) => {
        const isFormData = body instanceof FormData;
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'PUT',
            headers: getHeaders(isFormData),
            body: isFormData ? body : JSON.stringify(body)
        });
        return handleResponse(res);
    },
    delete: async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(res);
    }
};
export { BASE_URL };
