import { useFormStatus } from "react-dom";

export default function LoginButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full justify-center rounded-md border border-transparent bg-[#2c3e8c] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#2c3e8c]/90 focus:outline-none focus:ring-2 focus:ring-[#2c3e8c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Logging in..." : "Login"}
    </button>
  );
}