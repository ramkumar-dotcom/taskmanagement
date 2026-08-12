import AuthForm from "@/components/AuthForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Register — Task Management Board",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Create your account</h1>
        <p className="mt-2 text-sm text-stone-500">Free to start. You can open the board right away.</p>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <AuthForm mode="register" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
