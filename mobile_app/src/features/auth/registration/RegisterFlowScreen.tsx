import { useRouter } from 'expo-router';
import { CreditCard, Hash, Phone } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { useAuth, useRetryVirtualAccount } from '@/features/auth/hooks/useAuth';
import { useHardwareBackHandler } from '@/features/auth/hooks/useHardwareBackHandler';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Text } from '@/shared/typography/Text';
import type { BackendUser } from '@/types/backend';

import { buildRegisterPayload, isValidDobInput } from './buildRegisterPayload';
import { DateOfBirthField } from './DateOfBirthField';
import { formatIsoDateForDisplay } from './dobUtils';
import { humanizeRegistrationError, humanizeVirtualAccountWarning } from './registrationErrors';
import { hasFundableVirtualAccount, resolvePostRegisterStep } from './registrationOutcome';
import { validateRegistrationDraft } from './validateRegistrationDraft';

import { FaceConfirmationCamera } from './FaceConfirmationCamera';
import { LabeledTextInput } from './LabeledTextInput';
import { NameFieldsGroup } from './NameFieldsGroup';
import { OtpSixInput } from './OtpSixInput';
import { RadioTileGroup } from './RadioTileGroup';
import { RegistrationSelect } from './RegistrationSelect';
import { RegistrationShell } from './RegistrationShell';
import {
  GENDER_OPTIONS,
  REGISTRATION_GENDER_OPTIONS,
  NIGERIAN_STATES,
  OCCUPATION_OPTIONS,
  REGISTRATION_PROGRESS_TOTAL,
  REGISTRATION_STEPS,
  REGISTRATION_TOTAL_STEPS,
  registrationProgressIndex,
  registrationStepIndex,
} from './registrationConstants';
import { useRegistrationDraftStore } from './registrationDraftStore';
import { useRegistrationStepVoice } from './useRegistrationStepVoice';

const CONTINUE_ACCENT = '#2563eb';

const STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

function formatPhoneDisplay(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  return d;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function RegisterFlowScreen() {
  const router = useRouter();
  const hydrated = useRegistrationDraftStore((s) => s.hydrated);
  const hydrate = useRegistrationDraftStore((s) => s.hydrate);
  const updateDraft = useRegistrationDraftStore((s) => s.updateDraft);
  const clearDraft = useRegistrationDraftStore((s) => s.clearDraft);
  const clearFormFields = useRegistrationDraftStore((s) => s.clearFormFields);
  const goToStep = useRegistrationDraftStore((s) => s.goToStep);

  const stepIndex = useRegistrationDraftStore((s) => s.stepIndex);
  const firstName = useRegistrationDraftStore((s) => s.firstName);
  const middleName = useRegistrationDraftStore((s) => s.middleName);
  const lastName = useRegistrationDraftStore((s) => s.lastName);
  const phoneDigits = useRegistrationDraftStore((s) => s.phoneDigits);
  const email = useRegistrationDraftStore((s) => s.email);
  const dob = useRegistrationDraftStore((s) => s.dob);
  const nin = useRegistrationDraftStore((s) => s.nin);
  const bvn = useRegistrationDraftStore((s) => s.bvn);
  const gender = useRegistrationDraftStore((s) => s.gender);
  const state = useRegistrationDraftStore((s) => s.state);
  const lga = useRegistrationDraftStore((s) => s.lga);
  const homeAddress = useRegistrationDraftStore((s) => s.homeAddress);
  const occupationId = useRegistrationDraftStore((s) => s.occupationId);
  const savedPassword = useRegistrationDraftStore((s) => s.password);

  const [otpInput, setOtpInput] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [resendSec, setResendSec] = useState(0);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<BackendUser | null>(null);
  const [vaWarning, setVaWarning] = useState<string | null>(null);
  const registerStarted = useRef(false);
  const accountCreatedRef = useRef(false);
  const { register } = useAuth();
  const retryVirtualAccount = useRetryVirtualAccount();
  const walletIssueIdx = registrationStepIndex('wallet_setup_issue');
  const walletIdx = registrationStepIndex('wallet');
  const successIdx = registrationStepIndex('success');

  const reviewPassword = savedPassword || password;

  const stepMeta = REGISTRATION_STEPS[stepIndex] ?? REGISTRATION_STEPS[0];
  const { replay } = useRegistrationStepVoice(stepMeta.voiceLine, hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const prevStepId = useRef(stepMeta.id);
  useEffect(() => {
    const enteredPasswordStep = stepMeta.id === 'password' && prevStepId.current !== 'password';
    if (enteredPasswordStep && savedPassword) {
      setPassword(savedPassword);
      setPasswordConfirm(savedPassword);
    }
    prevStepId.current = stepMeta.id;
  }, [stepMeta.id, savedPassword]);

  const creatingIdx = registrationStepIndex('creating');

  const dismissReviewError = useCallback(() => {
    setRegisterError(null);
  }, []);

  useEffect(() => {
    if (stepIndex !== creatingIdx || registerStarted.current) {
      return;
    }
    registerStarted.current = true;
    setRegisterError(null);
    const draft = useRegistrationDraftStore.getState();
    const validationMessage = validateRegistrationDraft(draft);
    if (validationMessage) {
      setRegisterError(validationMessage);
      registerStarted.current = false;
      updateDraft({ stepIndex: registrationStepIndex('review') });
      return;
    }
    void (async () => {
      try {
        const payload = buildRegisterPayload(draft);
        if (!payload) {
          setRegisterError('Some details are missing or invalid. Please review each step.');
          registerStarted.current = false;
          updateDraft({ stepIndex: registrationStepIndex('review') });
          return;
        }
        const result = await register.mutateAsync(payload);
        setRegisteredUser(result.user);
        const friendlyWarning = humanizeVirtualAccountWarning(result.virtualAccountWarning);
        setVaWarning(friendlyWarning);
        accountCreatedRef.current = true;
        const nextStep = resolvePostRegisterStep(result);
        const targetIdx = nextStep === 'wallet' ? walletIdx : walletIssueIdx;
        await clearFormFields(targetIdx);
        setPassword('');
        setPasswordConfirm('');
        setOtpInput('');
        updateDraft({ stepIndex: targetIdx });
      } catch (e) {
        accountCreatedRef.current = false;
        setRegisterError(humanizeRegistrationError(getApiErrorMessage(e)));
        registerStarted.current = false;
        updateDraft({ stepIndex: registrationStepIndex('review') });
      }
    })();
  }, [stepIndex, updateDraft, creatingIdx, walletIdx, walletIssueIdx, register, clearFormFields]);

  const isOtpStep = REGISTRATION_STEPS[stepIndex]?.id === 'otp';

  useEffect(() => {
    if (isOtpStep) {
      setResendSec(45);
    }
  }, [isOtpStep]);

  useEffect(() => {
    if (!isOtpStep || resendSec <= 0) {
      return;
    }
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [isOtpStep, resendSec]);

  const walletNumber = registeredUser?.virtualAccountNumber?.trim() ?? '';
  const walletBank = registeredUser?.virtualAccountBankName ?? 'Partner bank';
  const canShowWalletReady = hasFundableVirtualAccount(registeredUser ?? {});

  useEffect(() => {
    if (stepMeta.id !== 'wallet' || canShowWalletReady) {
      return;
    }
    updateDraft({ stepIndex: walletIssueIdx });
  }, [stepMeta.id, canShowWalletReady, updateDraft, walletIssueIdx]);

  const displayFullName = useMemo(
    () => [firstName, middleName, lastName].map((s) => s.trim()).filter(Boolean).join(' '),
    [firstName, middleName, lastName],
  );

  const maskedBvn = useMemo(() => {
    const d = bvn.replace(/\D/g, '');
    if (d.length < 4) {
      return '—';
    }
    return `•••• ${d.slice(-4)}`;
  }, [bvn]);

  const goNext = useCallback(() => {
    updateDraft({ stepIndex: Math.min(REGISTRATION_TOTAL_STEPS - 1, stepIndex + 1) });
  }, [stepIndex, updateDraft]);

  const handleBack = useCallback(() => {
    if (stepIndex <= 0) {
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/');
      return;
    }
    if (stepMeta.id === 'creating' || stepMeta.id === 'success') {
      return;
    }
    if (accountCreatedRef.current) {
      return;
    }
    if (stepMeta.id === 'wallet' || stepMeta.id === 'wallet_setup_issue') {
      return;
    }
    const nextIndex = stepIndex - 1;
    if (stepMeta.id === 'face_scan') {
      updateDraft({ faceDone: false, stepIndex: nextIndex });
      return;
    }
    updateDraft({ stepIndex: nextIndex });
  }, [router, stepIndex, stepMeta.id, updateDraft]);

  useHardwareBackHandler(handleBack);

  const canContinue = useMemo(() => {
    switch (stepMeta.id) {
      case 'full_name':
        return firstName.trim().length >= 1 && lastName.trim().length >= 1;
      case 'phone': {
        const d = phoneDigits.replace(/\D/g, '');
        return d.length >= 10 && d.length <= 11;
      }
      case 'email':
        return isValidEmail(email);
      case 'dob':
        return isValidDobInput(dob);
      case 'otp':
        return otpInput.replace(/\D/g, '').length === 6;
      case 'password': {
        const ok = password.length >= 8 && password === passwordConfirm;
        return ok;
      }
      case 'face_intro':
        return true;
      case 'face_scan':
        return false;
      case 'nin': {
        const n = nin.replace(/\D/g, '');
        return n.length === 11;
      }
      case 'gender':
        return gender === 'male' || gender === 'female';
      case 'location':
        return Boolean(state) && lga.trim().length >= 2 && homeAddress.trim().length >= 5;
      case 'bvn': {
        const b = bvn.replace(/\D/g, '');
        return b.length === 11;
      }
      case 'occupation':
        return Boolean(occupationId);
      case 'review':
        return true;
      case 'creating':
        return false;
      case 'wallet':
        return canShowWalletReady;
      case 'wallet_setup_issue':
        return true;
      case 'success':
        return true;
      default:
        return false;
    }
  }, [
    stepMeta.id,
    firstName,
    lastName,
    phoneDigits,
    email,
    dob,
    otpInput,
    password,
    passwordConfirm,
    nin,
    bvn,
    gender,
    state,
    lga,
    homeAddress,
    occupationId,
    canShowWalletReady,
  ]);

  const onPrimaryPress = useCallback(() => {
    switch (stepMeta.id) {
      case 'full_name':
        goNext();
        break;
      case 'phone':
        goNext();
        break;
      case 'email':
        goNext();
        break;
      case 'dob':
        goNext();
        break;
      case 'otp':
        updateDraft({ otpVerified: true });
        setOtpInput('');
        goNext();
        break;
      case 'password':
        updateDraft({ password });
        goNext();
        break;
      case 'face_intro':
        goNext();
        break;
      case 'review':
        registerStarted.current = false;
        setRegisterError(null);
        updateDraft({ stepIndex: registrationStepIndex('creating') });
        break;
      case 'wallet':
      case 'wallet_setup_issue':
        goToStep(successIdx);
        break;
      case 'success':
        void (async () => {
          accountCreatedRef.current = false;
          registerStarted.current = false;
          setRegisteredUser(null);
          setVaWarning(null);
          setRegisterError(null);
          await clearDraft();
          router.replace('/(tabs)/home');
        })();
        break;
      default:
        goNext();
    }
  }, [stepMeta.id, goNext, goToStep, updateDraft, router, clearDraft, successIdx, password]);

  const showBack =
    !accountCreatedRef.current &&
    stepMeta.id !== 'creating' &&
    stepMeta.id !== 'success' &&
    stepMeta.id !== 'wallet' &&
    stepMeta.id !== 'wallet_setup_issue';
  const scrollable = stepMeta.id !== 'face_scan';

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={CONTINUE_ACCENT} />
        <Text className="mt-3 text-sm text-neutral-500">Loading your saved progress…</Text>
      </View>
    );
  }

  const footerContinueLabel =
    stepMeta.id === 'success'
      ? 'Done'
      : stepMeta.id === 'wallet'
        ? 'Continue'
        : stepMeta.id === 'wallet_setup_issue'
          ? 'Continue to app'
          : stepMeta.id === 'review'
            ? 'Create account'
            : 'Continue';

  const footer =
    stepMeta.id === 'face_scan' || stepMeta.id === 'creating' ? null : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={footerContinueLabel}
        disabled={!canContinue && stepMeta.id !== 'wallet' && stepMeta.id !== 'wallet_setup_issue'}
        onPress={onPrimaryPress}
        className="mb-2 w-full items-center rounded-xl py-4 active:opacity-90"
        style={{
          backgroundColor: CONTINUE_ACCENT,
          opacity: !canContinue && stepMeta.id !== 'wallet' && stepMeta.id !== 'success' ? 0.45 : 1,
        }}
      >
        <Text className="text-base font-semibold text-white">{footerContinueLabel}</Text>
      </Pressable>
    );

  return (
    <RegistrationShell
      stepIndex={registrationProgressIndex(stepMeta.id)}
      totalSteps={REGISTRATION_PROGRESS_TOTAL}
      onBack={handleBack}
      showBack={showBack}
      footer={footer}
      scrollable={scrollable}
      onReplayVoice={replay}
      voiceAvailable={Boolean(stepMeta.voiceLine?.trim())}
    >
      <Text className="text-[28px] font-bold leading-tight tracking-tight text-neutral-900">{stepMeta.title}</Text>
      <Text className="mt-2 text-base leading-relaxed text-neutral-500">{stepMeta.subtitle}</Text>

      <View className="mt-8 gap-6">
        {stepMeta.id === 'full_name' ? (
          <NameFieldsGroup
            firstName={firstName}
            middleName={middleName}
            lastName={lastName}
            onChangeFirst={(t) => updateDraft({ firstName: t })}
            onChangeMiddle={(t) => updateDraft({ middleName: t })}
            onChangeLast={(t) => updateDraft({ lastName: t })}
          />
        ) : null}

        {stepMeta.id === 'phone' ? (
          <View className="gap-4">
            <LabeledTextInput
              label="Phone number"
              required
              value={formatPhoneDisplay(phoneDigits)}
              onChangeText={(t) => updateDraft({ phoneDigits: t.replace(/\D/g, '').slice(0, 11) })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              leftAccessory={
                <View className="mr-2 shrink-0 flex-row items-center border-r border-neutral-200 pr-2">
                  <Text className="text-sm font-semibold text-neutral-700">+234</Text>
                </View>
              }
              rightAccessory={<Phone size={20} color="#a3a3a3" style={{ marginLeft: 4 }} />}
              accessibilityLabel="Phone number"
            />
            <Text className="text-xs leading-relaxed text-neutral-500">We will send a code by SMS, then you will create a password on the next step.</Text>
          </View>
        ) : null}

        {stepMeta.id === 'email' ? (
          <LabeledTextInput
            label="Email address"
            required
            value={email}
            onChangeText={(t) => {
              updateDraft({ email: t });
              dismissReviewError();
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email address"
          />
        ) : null}

        {stepMeta.id === 'dob' ? <DateOfBirthField value={dob} onChange={(iso) => updateDraft({ dob: iso })} /> : null}

        {stepMeta.id === 'otp' ? (
          <View className="gap-5">
            <OtpSixInput value={otpInput} onChange={setOtpInput} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              disabled={resendSec > 0}
              onPress={() => setResendSec(45)}
              className="self-center"
            >
              <Text className={`text-sm font-semibold ${resendSec > 0 ? 'text-neutral-400' : 'text-brand-700'}`}>
                {resendSec > 0 ? `Resend code in ${resendSec}s` : 'Resend code'}
              </Text>
            </Pressable>
            <Text className="text-center text-xs text-neutral-500">Tip: stay on this screen until the SMS arrives.</Text>
          </View>
        ) : null}

        {stepMeta.id === 'password' ? (
          <View className="gap-4">
            <LabeledTextInput
              label="Password"
              required
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              autoCapitalize="none"
              secureTextEntry
              autoComplete="password"
              textContentType="newPassword"
              accessibilityLabel="Password"
            />
            <LabeledTextInput
              label="Confirm password"
              required
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="Type your password again"
              autoCapitalize="none"
              secureTextEntry
              autoComplete="password"
              textContentType="newPassword"
              accessibilityLabel="Confirm password"
            />
          </View>
        ) : null}

        {stepMeta.id === 'face_intro' ? (
          <Text className="text-base leading-relaxed text-neutral-600">
            We need to confirm your face to protect your account. You will see your own camera preview—nothing sudden, and you tap when you are ready.
          </Text>
        ) : null}

        {stepMeta.id === 'face_scan' ? (
          <FaceConfirmationCamera
            onComplete={() => {
              updateDraft({ faceDone: true });
              goNext();
            }}
          />
        ) : null}

        {stepMeta.id === 'nin' ? (
          <LabeledTextInput
            label="NIN (11 digits)"
            required
            value={nin}
            onChangeText={(t) => updateDraft({ nin: t.replace(/\D/g, '').slice(0, 11) })}
            placeholder="Enter your NIN"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            maxLength={11}
            rightAccessory={<Hash size={20} color="#a3a3a3" style={{ marginLeft: 4 }} />}
            accessibilityLabel="National Identification Number"
          />
        ) : null}

        {stepMeta.id === 'gender' ? (
          <RadioTileGroup
            accessibilityLabel="Gender"
            options={REGISTRATION_GENDER_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={gender}
            onChange={(id) => updateDraft({ gender: id })}
          />
        ) : null}

        {stepMeta.id === 'location' ? (
          <View className="gap-5">
            <RegistrationSelect
              label="State"
              required
              placeholder="Select your state"
              value={state}
              options={STATE_OPTIONS}
              onChange={(v) => updateDraft({ state: v })}
              accessibilityLabel="State"
            />
            <LabeledTextInput
              label="Local government area (LGA)"
              required
              value={lga}
              onChangeText={(t) => updateDraft({ lga: t })}
              placeholder="e.g. Ikeja, Port Harcourt"
              autoCapitalize="words"
              accessibilityLabel="Local government area"
            />
            <LabeledTextInput
              label="Home address"
              required
              value={homeAddress}
              onChangeText={(t) => updateDraft({ homeAddress: t })}
              placeholder="Street, area, and nearby landmark"
              autoCapitalize="sentences"
              multiline
              accessibilityLabel="Home address"
            />
          </View>
        ) : null}

        {stepMeta.id === 'bvn' ? (
          <LabeledTextInput
            label="BVN (11 digits)"
            required
            value={bvn}
            onChangeText={(t) => updateDraft({ bvn: t.replace(/\D/g, '').slice(0, 11) })}
            placeholder="Enter your BVN"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            maxLength={11}
            rightAccessory={<CreditCard size={20} color="#a3a3a3" style={{ marginLeft: 4 }} />}
            accessibilityLabel="Bank Verification Number"
          />
        ) : null}

        {stepMeta.id === 'occupation' ? (
          <RadioTileGroup
            accessibilityLabel="Occupation type"
            options={OCCUPATION_OPTIONS.map((o) => ({ id: o.id, label: o.label, hint: o.hint }))}
            value={occupationId}
            onChange={(id) => updateDraft({ occupationId: id })}
          />
        ) : null}

        {stepMeta.id === 'review' ? (
          <View className="gap-3">
            {registerError ? (
              <MessageBanner variant="error" title="Could not create account" message={registerError} />
            ) : null}
            <ReviewRow label="Name" value={displayFullName || '—'} onEdit={() => goToStep(registrationStepIndex('full_name'))} />
            <ReviewRow label="Phone" value={`+234 ${formatPhoneDisplay(phoneDigits)}`} onEdit={() => goToStep(registrationStepIndex('phone'))} />
            <ReviewRow label="Email" value={email.trim() || '—'} onEdit={() => goToStep(registrationStepIndex('email'))} />
            <ReviewRow
              label="Date of birth"
              value={dob.trim() ? formatIsoDateForDisplay(dob) : '—'}
              onEdit={() => goToStep(registrationStepIndex('dob'))}
            />
            <ReviewRow
              label="Password"
              value={reviewPassword.length >= 8 ? '••••••••' : '—'}
              onEdit={() => goToStep(registrationStepIndex('password'))}
            />
            <ReviewRow label="NIN" value={nin.replace(/\D/g, '')} onEdit={() => goToStep(registrationStepIndex('nin'))} />
            <ReviewRow
              label="Gender"
              value={REGISTRATION_GENDER_OPTIONS.find((g) => g.id === gender)?.label ?? '—'}
              onEdit={() => goToStep(registrationStepIndex('gender'))}
            />
            <ReviewRow
              label="Location"
              value={[state, lga.trim(), homeAddress.trim()].filter(Boolean).join(' · ') || '—'}
              onEdit={() => goToStep(registrationStepIndex('location'))}
            />
            <ReviewRow label="BVN" value={maskedBvn} onEdit={() => goToStep(registrationStepIndex('bvn'))} />
            <ReviewRow
              label="Work type"
              value={OCCUPATION_OPTIONS.find((o) => o.id === occupationId)?.label ?? '—'}
              onEdit={() => goToStep(registrationStepIndex('occupation'))}
            />
          </View>
        ) : null}

        {stepMeta.id === 'creating' ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color={CONTINUE_ACCENT} />
            <Text className="mt-6 text-center text-base text-neutral-600">Creating your profile…</Text>
            <Text className="mt-2 text-center text-sm text-neutral-500">Setting up your BetaHealth wallet.</Text>
          </View>
        ) : null}

        {stepMeta.id === 'wallet' && canShowWalletReady ? (
          <View className="gap-4 py-2">
            <MessageBanner
              variant="success"
              title="Wallet ready"
              message="Your funding account is set up. Save these details and transfer from your bank app to activate cover."
            />
            <Text className="text-sm font-medium text-neutral-500">BetaHealth virtual account</Text>
            <Text className="text-2xl font-bold tracking-wide text-neutral-900">{walletNumber}</Text>
            <Text className="text-base text-neutral-600">{walletBank}</Text>
            <Text className="text-xs leading-relaxed text-neutral-500">
              Fund this account from your bank app. You can manage your plan from the home screen.
            </Text>
          </View>
        ) : null}

        {stepMeta.id === 'wallet_setup_issue' ? (
          <View className="gap-4 py-2">
            {vaWarning ? (
              <MessageBanner variant="error" title="Funding account not ready" message={vaWarning} />
            ) : (
              <MessageBanner
                variant="error"
                title="Funding account not ready"
                message="We saved your profile, but your bank account number is not ready yet. Check that your BVN, full name, and date of birth match your bank records."
              />
            )}
            <Text className="text-sm leading-relaxed text-neutral-600">
              You can open the app and try again from your Wallet tab after confirming your details with your bank.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try setting up funding account again"
              disabled={retryVirtualAccount.isPending}
              onPress={() => {
                void (async () => {
                  try {
                    const user = await retryVirtualAccount.mutateAsync();
                    setRegisteredUser(user);
                    if (hasFundableVirtualAccount(user)) {
                      setVaWarning(null);
                      setRegisteredUser(user);
                      updateDraft({ stepIndex: walletIdx });
                    } else {
                      setVaWarning(
                        'Your funding account is still not ready. Confirm your BVN, name, and date of birth match your bank, then try again.',
                      );
                    }
                  } catch (e) {
                    setVaWarning(humanizeRegistrationError(getApiErrorMessage(e)));
                  }
                })();
              }}
              className="items-center rounded-xl border border-brand-600 bg-white py-3.5 active:opacity-90"
            >
              {retryVirtualAccount.isPending ? (
                <ActivityIndicator color={CONTINUE_ACCENT} />
              ) : (
                <Text className="text-base font-semibold text-brand-700">Try again</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {stepMeta.id === 'success' ? (
          <View className="items-center gap-4 py-10">
            <MessageBanner
              variant="success"
              title="Account created"
              message={
                registeredUser?.fullName
                  ? `Welcome, ${registeredUser.fullName.split(/\s+/)[0] ?? 'member'}. Your profile is saved on our servers.`
                  : 'Your profile is saved. You can fund your wallet from the home screen.'
              }
            />
            <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-100">
              <Text className="text-4xl">✓</Text>
            </View>
            <Text className="text-center text-base leading-relaxed text-neutral-600">
              Choose your plan and fund your wallet from the home screen when you are ready.
            </Text>
            {registeredUser?.virtualAccountNumber ? (
              <Text className="text-center text-xs text-neutral-500">
                Funding account {registeredUser.virtualAccountNumber}
                {registeredUser.virtualAccountBankName ? ` · ${registeredUser.virtualAccountBankName}` : ''}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </RegistrationShell>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View className="flex-row items-start justify-between gap-3 border-b border-neutral-100 py-4">
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</Text>
        <Text className="mt-1 text-base leading-snug text-neutral-900">{value}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label}`} onPress={onEdit} hitSlop={8} className="py-1">
        <Text className="text-sm font-semibold text-brand-700">Edit</Text>
      </Pressable>
    </View>
  );
}
