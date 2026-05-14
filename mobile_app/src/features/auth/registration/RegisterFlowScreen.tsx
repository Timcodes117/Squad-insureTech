import { useRouter } from 'expo-router';
import { Hash, ChevronDown, Phone } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { useHardwareBackHandler } from '@/features/auth/hooks/useHardwareBackHandler';
import { Text } from '@/shared/typography/Text';

import { FaceConfirmationCamera } from './FaceConfirmationCamera';
import { LabeledTextInput } from './LabeledTextInput';
import { NameFieldsGroup } from './NameFieldsGroup';
import { OtpSixInput } from './OtpSixInput';
import { RadioTileGroup } from './RadioTileGroup';
import { RegistrationShell } from './RegistrationShell';
import {
  AGE_RANGE_OPTIONS,
  BETAHEALTH_PLANS,
  GENDER_OPTIONS,
  NIGERIAN_STATES,
  OCCUPATION_OPTIONS,
  PAYMENT_OPTIONS,
  REGISTRATION_STEPS,
  REGISTRATION_TOTAL_STEPS,
  formatNaira,
  planById,
  planForTier,
  registrationStepIndex,
  tierForOccupationId,
} from './registrationConstants';
import { useRegistrationDraftStore } from './registrationDraftStore';
import { useRegistrationStepVoice } from './useRegistrationStepVoice';

const CONTINUE_ACCENT = '#2563eb';

function formatPhoneDisplay(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  return d;
}

function fakeWalletAccount(phoneDigits: string) {
  const d = phoneDigits.replace(/\D/g, '').padStart(10, '0').slice(-10);
  return `998${d.slice(0, 7)}${d.slice(7)}`;
}

export default function RegisterFlowScreen() {
  const router = useRouter();
  const hydrated = useRegistrationDraftStore((s) => s.hydrated);
  const hydrate = useRegistrationDraftStore((s) => s.hydrate);
  const updateDraft = useRegistrationDraftStore((s) => s.updateDraft);
  const clearDraft = useRegistrationDraftStore((s) => s.clearDraft);
  const goToStep = useRegistrationDraftStore((s) => s.goToStep);

  const stepIndex = useRegistrationDraftStore((s) => s.stepIndex);
  const firstName = useRegistrationDraftStore((s) => s.firstName);
  const middleName = useRegistrationDraftStore((s) => s.middleName);
  const lastName = useRegistrationDraftStore((s) => s.lastName);
  const phoneDigits = useRegistrationDraftStore((s) => s.phoneDigits);
  const nin = useRegistrationDraftStore((s) => s.nin);
  const ageRange = useRegistrationDraftStore((s) => s.ageRange);
  const gender = useRegistrationDraftStore((s) => s.gender);
  const state = useRegistrationDraftStore((s) => s.state);
  const paymentFrequency = useRegistrationDraftStore((s) => s.paymentFrequency);
  const occupationId = useRegistrationDraftStore((s) => s.occupationId);
  const planId = useRegistrationDraftStore((s) => s.planId);

  const [otpInput, setOtpInput] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [resendSec, setResendSec] = useState(0);
  const [stateQuery, setStateQuery] = useState('');

  const stepMeta = REGISTRATION_STEPS[stepIndex] ?? REGISTRATION_STEPS[0];
  const { replay } = useRegistrationStepVoice(stepMeta.voiceLine, hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const creatingIdx = registrationStepIndex('creating');
  const walletIdx = registrationStepIndex('wallet');

  useEffect(() => {
    if (stepIndex !== creatingIdx) {
      return;
    }
    const timer = setTimeout(() => {
      updateDraft({ stepIndex: walletIdx });
    }, 2400);
    return () => clearTimeout(timer);
  }, [stepIndex, updateDraft, creatingIdx, walletIdx]);

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

  const filteredStates = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    if (!q) {
      return [...NIGERIAN_STATES];
    }
    return NIGERIAN_STATES.filter((s) => s.toLowerCase().includes(q));
  }, [stateQuery]);

  const walletNumber = useMemo(() => fakeWalletAccount(phoneDigits), [phoneDigits]);

  const selectedPlan = useMemo(() => planById(planId), [planId]);

  const displayFullName = useMemo(
    () => [firstName, middleName, lastName].map((s) => s.trim()).filter(Boolean).join(' '),
    [firstName, middleName, lastName],
  );

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
    if (stepMeta.id === 'wallet') {
      updateDraft({ stepIndex: registrationStepIndex('review') });
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
      case 'age_range':
        return Boolean(ageRange);
      case 'gender':
        return Boolean(gender);
      case 'state':
        return Boolean(state);
      case 'payment_frequency':
        return paymentFrequency === 'weekly' || paymentFrequency === 'monthly';
      case 'occupation':
        return Boolean(occupationId);
      case 'plan': {
        const tier = tierForOccupationId(occupationId);
        const p = planById(planId);
        return Boolean(tier && p && p.tier === tier);
      }
      case 'review':
        return true;
      case 'creating':
        return false;
      case 'wallet':
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
    otpInput,
    password,
    passwordConfirm,
    nin,
    ageRange,
    gender,
    state,
    paymentFrequency,
    occupationId,
    planId,
  ]);

  const onPrimaryPress = useCallback(() => {
    switch (stepMeta.id) {
      case 'full_name':
        goNext();
        break;
      case 'phone':
        goNext();
        break;
      case 'otp':
        updateDraft({ otpVerified: true });
        setOtpInput('');
        goNext();
        break;
      case 'face_intro':
        goNext();
        break;
      case 'review':
        updateDraft({ stepIndex: registrationStepIndex('creating') });
        break;
      case 'wallet':
        goNext();
        break;
      case 'success':
        void (async () => {
          setPassword('');
          setPasswordConfirm('');
          await clearDraft();
          router.replace('/(tabs)/home');
        })();
        break;
      default:
        goNext();
    }
  }, [stepMeta.id, goNext, updateDraft, router, clearDraft, setPassword, setPasswordConfirm]);

  const showBack = stepMeta.id !== 'creating' && stepMeta.id !== 'success';
  const scrollable = stepMeta.id !== 'face_scan' && stepMeta.id !== 'creating';

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
        : stepMeta.id === 'review'
          ? 'Create account'
          : 'Continue';

  const footer =
    stepMeta.id === 'face_scan' || stepMeta.id === 'creating' ? null : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={footerContinueLabel}
        disabled={!canContinue && stepMeta.id !== 'wallet'}
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
      stepIndex={stepIndex}
      totalSteps={REGISTRATION_TOTAL_STEPS}
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
                <View className="mr-2 flex-row items-center gap-1 border-r border-neutral-200 pr-2">
                  <Text className="text-sm font-semibold text-neutral-700">NG</Text>
                  <ChevronDown size={16} color="#737373" />
                  <Text className="text-sm text-neutral-500">+234</Text>
                </View>
              }
              rightAccessory={<Phone size={20} color="#a3a3a3" style={{ marginLeft: 4 }} />}
              accessibilityLabel="Phone number"
            />
            <Text className="text-xs leading-relaxed text-neutral-500">We will send a code by SMS, then you will create a password on the next step.</Text>
          </View>
        ) : null}

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
            keyboardType="numeric"
            autoCapitalize="none"
            maxLength={11}
            rightAccessory={<Hash size={20} color="#a3a3a3" style={{ marginLeft: 4 }} />}
            accessibilityLabel="National Identification Number"
          />
        ) : null}

        {stepMeta.id === 'age_range' ? (
          <RadioTileGroup
            accessibilityLabel="Age range"
            options={AGE_RANGE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={ageRange}
            onChange={(id) => updateDraft({ ageRange: id })}
          />
        ) : null}

        {stepMeta.id === 'gender' ? (
          <RadioTileGroup
            accessibilityLabel="Gender"
            options={GENDER_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={gender}
            onChange={(id) => updateDraft({ gender: id })}
          />
        ) : null}

        {stepMeta.id === 'state' ? (
          <View className="gap-3">
            <LabeledTextInput
              label="Search state"
              value={stateQuery}
              onChangeText={setStateQuery}
              placeholder="Type to search"
              autoCapitalize="words"
              accessibilityLabel="Search Nigerian states"
            />
            <ScrollView className="max-h-64" keyboardShouldPersistTaps="handled">
              {filteredStates.map((st) => {
                const selected = state === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => updateDraft({ state: st })}
                    className={`border-b border-neutral-100 py-3.5 ${selected ? 'bg-transparent' : 'active:opacity-70'}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text className={`text-base ${selected ? 'font-semibold text-brand-800' : 'text-neutral-900'}`}>{st}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {stepMeta.id === 'payment_frequency' ? (
          <RadioTileGroup
            accessibilityLabel="Payment frequency"
            options={PAYMENT_OPTIONS.map((o) => ({ id: o.id, label: o.label, hint: o.hint }))}
            value={paymentFrequency}
            onChange={(id) => updateDraft({ paymentFrequency: id as 'weekly' | 'monthly' })}
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

        {stepMeta.id === 'plan' ? (
          <View className="gap-4">
            {(() => {
              const tier = tierForOccupationId(occupationId);
              return BETAHEALTH_PLANS.map((plan) => {
                const matchesJob = tier === plan.tier;
                const selected = planId === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    disabled={!matchesJob}
                    onPress={() => matchesJob && updateDraft({ planId: plan.id })}
                    className={`rounded-2xl border-2 px-4 py-4 ${
                      selected && matchesJob
                        ? 'border-brand-600 bg-brand-50'
                        : matchesJob
                          ? 'border-neutral-200 bg-white active:bg-neutral-50'
                          : 'border-neutral-100 bg-neutral-50 opacity-60'
                    }`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected && matchesJob, disabled: !matchesJob }}
                  >
                    <View className="flex-row items-baseline justify-between gap-2">
                      <Text className={`text-lg font-bold ${selected && matchesJob ? 'text-brand-900' : 'text-neutral-900'}`}>{plan.name}</Text>
                      <Text className="text-base font-semibold text-brand-700">{formatNaira(plan.weeklyNaira)}/wk</Text>
                    </View>
                    <Text className="mt-1 text-sm text-neutral-600">{plan.audience}</Text>
                    <Text className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                      {formatNaira(plan.monthlyCapNaira)} monthly cap
                    </Text>
                    {!matchesJob ? (
                      <Text className="mt-2 text-xs text-neutral-500">Based on your work type, your tier is {tier ? planForTier(tier).name : '—'}.</Text>
                    ) : null}
                    <View className="mt-3 gap-1.5">
                      {plan.bullets.map((b) => (
                        <Text key={b} className="text-sm leading-relaxed text-neutral-600">
                          • {b}
                        </Text>
                      ))}
                    </View>
                  </Pressable>
                );
              });
            })()}
          </View>
        ) : null}

        {stepMeta.id === 'review' ? (
          <View className="gap-3">
            <ReviewRow label="Name" value={displayFullName || '—'} onEdit={() => goToStep(registrationStepIndex('full_name'))} />
            <ReviewRow label="Phone" value={`+234 ${formatPhoneDisplay(phoneDigits)}`} onEdit={() => goToStep(registrationStepIndex('phone'))} />
            <ReviewRow
              label="Password"
              value={password.length >= 8 ? '••••••••' : '—'}
              onEdit={() => goToStep(registrationStepIndex('password'))}
            />
            <ReviewRow label="NIN" value={nin.replace(/\D/g, '')} onEdit={() => goToStep(registrationStepIndex('nin'))} />
            <ReviewRow label="Age range" value={ageRange ?? '—'} onEdit={() => goToStep(registrationStepIndex('age_range'))} />
            <ReviewRow label="Gender" value={GENDER_OPTIONS.find((g) => g.id === gender)?.label ?? '—'} onEdit={() => goToStep(registrationStepIndex('gender'))} />
            <ReviewRow label="State" value={state ?? '—'} onEdit={() => goToStep(registrationStepIndex('state'))} />
            <ReviewRow
              label="Payments"
              value={paymentFrequency === 'weekly' ? 'Weekly' : paymentFrequency === 'monthly' ? 'Monthly' : '—'}
              onEdit={() => goToStep(registrationStepIndex('payment_frequency'))}
            />
            <ReviewRow
              label="Work type"
              value={OCCUPATION_OPTIONS.find((o) => o.id === occupationId)?.label ?? '—'}
              onEdit={() => goToStep(registrationStepIndex('occupation'))}
            />
            <ReviewRow
              label="Plan"
              value={selectedPlan ? `${selectedPlan.name} (${formatNaira(selectedPlan.weeklyNaira)}/wk)` : '—'}
              onEdit={() => goToStep(registrationStepIndex('plan'))}
            />
          </View>
        ) : null}

        {stepMeta.id === 'creating' ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color={CONTINUE_ACCENT} />
            <Text className="mt-6 text-center text-base text-neutral-600">Creating your profile…</Text>
            <Text className="mt-2 text-center text-sm text-neutral-500">Setting up your BetaHealth wallet and cover profile.</Text>
          </View>
        ) : null}

        {stepMeta.id === 'wallet' ? (
          <View className="gap-4 py-2">
            <Text className="text-sm font-medium text-neutral-500">BetaHealth virtual account</Text>
            <Text className="text-2xl font-bold tracking-wide text-neutral-900">{walletNumber}</Text>
            <Text className="text-base text-neutral-600">Partner bank (Squad)</Text>
            <View className="my-2 h-px bg-neutral-100" />
            <Text className="text-sm text-neutral-600">
              Plan:{' '}
              <Text className="font-semibold text-neutral-900">
                {selectedPlan?.name ?? '—'}
                {selectedPlan ? ` — ${formatNaira(selectedPlan.weeklyNaira)} weekly` : ''}
              </Text>
              {selectedPlan ? (
                <Text className="text-neutral-600">
                  {' '}
                  · {formatNaira(selectedPlan.monthlyCapNaira)} monthly hospital help cap
                </Text>
              ) : null}
            </Text>
            <Text className="text-xs leading-relaxed text-neutral-500">
              Fund this account from your bank app. Cover turns on after your first successful payment (demo).
            </Text>
          </View>
        ) : null}

        {stepMeta.id === 'success' ? (
          <View className="items-center gap-4 py-10">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-100">
              <Text className="text-4xl">✓</Text>
            </View>
            <Text className="text-center text-base leading-relaxed text-neutral-600">
              Welcome to BetaHealth. Fund your wallet to activate cover—partner hospitals can confirm you before care.
            </Text>
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
        <Text className="mt-1 text-base text-neutral-900">{value}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label}`} onPress={onEdit} hitSlop={8} className="py-1">
        <Text className="text-sm font-semibold text-brand-700">Edit</Text>
      </Pressable>
    </View>
  );
}
