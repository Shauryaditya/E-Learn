"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileForm } from "@/components/forms/profile-form";

interface StudentOnboardingModalProps {
  isOpen: boolean;
}

export const StudentOnboardingModal = ({
  isOpen
}: StudentOnboardingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Let&apos;s setup your profile.</DialogTitle>
          <DialogDescription>
            Tell us a bit about yourself so we can personalize your learning experience.
          </DialogDescription>
        </DialogHeader>

        <ProfileForm />
      </DialogContent>
    </Dialog>
  );
};
