'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  validateRescuerName,
  validateAndExtractIndianMobile,
  formatNormalizedPhone,
  addRescuer,
} from '@/lib/rescuers';
import { useAuth, usePermission } from '@/hooks/useAuth';

interface AddRescuerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newRescuerId: string, name: string) => void;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function AddRescuerDialog({
  open,
  onOpenChange,
  onSuccess,
  triggerButtonRef,
}: AddRescuerDialogProps) {
  const { currentUser } = useAuth();
  const { canManageRescuers } = usePermission();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form whenever modal opens/closes
  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setNameTouched(false);
      setPhoneTouched(false);
      setNameError(null);
      setPhoneError(null);

      // Autofocus Name field on open
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } else {
      // Focus returns to trigger button on close
      setTimeout(() => {
        triggerButtonRef?.current?.focus();
      }, 50);
    }
  }, [open, triggerButtonRef]);

  // Real-time or blur validation for Name
  const validateNameField = (val: string): boolean => {
    const res = validateRescuerName(val);
    if (!res.isValid) {
      setNameError(res.error || 'Invalid name');
      return false;
    }
    setNameError(null);
    return true;
  };

  // Real-time or blur validation for Phone
  const validatePhoneField = (val: string): boolean => {
    const tenDigits = validateAndExtractIndianMobile(val);
    if (!tenDigits) {
      setNameError((prev) => prev); // keep previous
      setPhoneError(
        'Please enter a valid 10-digit Indian mobile number (e.g. 9845012345 or +91 98450 12345).'
      );
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (nameTouched) {
      validateNameField(val);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (phoneTouched) {
      validatePhoneField(val);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Enforce permission in action handler
    if (!canManageRescuers) {
      setPhoneError('Unauthorized: Only System Admin can add rescuers.');
      return;
    }

    setNameTouched(true);
    setPhoneTouched(true);

    const isNameValid = validateNameField(name);
    const isPhoneValid = validatePhoneField(phone);

    if (!isNameValid || !isPhoneValid) {
      return;
    }

    const tenDigits = validateAndExtractIndianMobile(phone)!;
    const formattedPhone = formatNormalizedPhone(tenDigits);
    const trimmedName = name.trim();

    const result = addRescuer(trimmedName, formattedPhone, {
      name: currentUser.name,
      roleTitle: currentUser.roleTitle,
    });

    if (!result.success) {
      // Duplicate phone error or general error
      setPhoneError(result.error || 'Failed to add rescuer');
      return;
    }

    // Success: notify parent, close dialog
    onSuccess(result.rescuer!.id, trimmedName);
    onOpenChange(false);
  };

  // If user lacks permission, do not render dialog
  if (!canManageRescuers) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 bg-white border border-[#CBD5E1] rounded-[4px] shadow-none gap-0 text-slate-900">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-lg font-bold text-[#0F172A] tracking-tight">
            Add rescuer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="rescuer-name"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              Name
            </label>
            <input
              id="rescuer-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={() => {
                setNameTouched(true);
                validateNameField(name);
              }}
              placeholder="e.g. Suresh Kumar"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? 'name-error-msg' : undefined}
              className="w-full min-h-[44px] px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#CBD5E1] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-colors placeholder:text-slate-400"
            />
            {nameError && (
              <p
                id="name-error-msg"
                role="alert"
                className="text-xs text-[#DC2626] font-medium pt-0.5"
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="rescuer-phone"
              className="block text-sm font-semibold text-[#0F172A]"
            >
              Phone
            </label>
            <input
              id="rescuer-phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => {
                setPhoneTouched(true);
                validatePhoneField(phone);
              }}
              placeholder="e.g. 98450 12345 or +91 98450 12345"
              aria-invalid={phoneError ? 'true' : 'false'}
              aria-describedby={phoneError ? 'phone-error-msg' : undefined}
              className="w-full min-h-[44px] px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#CBD5E1] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-colors placeholder:text-slate-400 font-mono"
            />
            {phoneError && (
              <p
                id="phone-error-msg"
                role="alert"
                className="text-xs text-[#DC2626] font-medium pt-0.5"
              >
                {phoneError}
              </p>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-[4px] hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-[#0F172A] rounded-[4px] hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F172A]"
            >
              Save rescuer
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
