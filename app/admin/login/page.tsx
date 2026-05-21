import RoleLoginPage from "@/app/components/RoleLoginPage";

export default function AdminLoginPage() {
    return (
        <RoleLoginPage
            role="admin"
            title="Admin Login"
            subtitle="Access municipality controls, route monitoring, and broadcast tools."
            accentClass="bg-gradient-to-r from-blue-700 to-indigo-700"
            icon="admin"
        />
    );
}
