import RoleLoginPage from "@/app/components/RoleLoginPage";

export default function DriverLoginPage() {
    return (
        <RoleLoginPage
            role="driver"
            title="Driver Login"
            subtitle="Update truck status, report live coordinates, and run demo movement."
            accentClass="bg-gradient-to-r from-emerald-700 to-cyan-700"
            icon="driver"
        />
    );
}
