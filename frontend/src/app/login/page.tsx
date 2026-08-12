import AuthForm from "@/components/AuthForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Login — Task Management Board",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">Welcome back</h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Log in to open your board.</p>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <AuthForm mode="login" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
