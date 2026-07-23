"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";
import { Header } from "@/components/dashboard/header";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Profile" description="Manage your account and personal settings" />

      <div className="p-6 space-y-6 max-w-3xl">
        {isLoaded && user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-zinc-900/60 p-5"
          >
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? "User"}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">{user.fullName}</h2>
                <p className="text-zinc-400 text-sm">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Mail className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-zinc-300 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Calendar className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-xs text-zinc-500">Joined</p>
                  <p className="text-sm text-zinc-300">{formatDate(user.createdAt!)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Shield className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-zinc-500">Auth</p>
                  <p className="text-sm text-zinc-300">Clerk</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-zinc-900 border border-white/10 shadow-none w-full",
                navbar: "bg-zinc-950 border-r border-white/10",
                navbarMobileMenuButton: "text-white",
                headerTitle: "text-white",
                headerSubtitle: "text-zinc-400",
                formFieldLabel: "text-zinc-300",
                formFieldInput: "bg-zinc-800 border-white/10 text-white",
                formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600",
                badge: "bg-indigo-500/10 text-indigo-300",
                profileSectionTitle: "text-white",
                profileSectionContent: "text-zinc-400",
                accordionTriggerButton: "text-zinc-300 hover:text-white",
              },
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
