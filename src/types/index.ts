export interface Plugin {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'deleted';
    version: string;
    description: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
}