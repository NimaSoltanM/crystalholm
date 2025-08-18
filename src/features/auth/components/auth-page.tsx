import React, { useState, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Phone, User, CheckCircle, ArrowRight } from 'lucide-react';
import { sendVerificationCode, verifyCode, completeProfile } from '../actions';
import { useCartSync } from '@/features/cart/use-cart-sync';
import { getCurrentUser } from '../actions';

const AuthPage = () => {
  const router = useRouter();
  const { syncCart } = useCartSync();
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error('شماره تلفن را وارد کنید');
      return;
    }

    if (phoneNumber.length < 11) {
      toast.error('شماره تلفن معتبر نیست');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendVerificationCode({ data: { phoneNumber } });
      toast.success(`${res.code}`, {
        duration: 10000,
      });
      setStep('code');
      setTimer(120);
    } catch (error) {
      toast.error(error.message || 'خطا در ارسال کد');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 5) {
      toast.error('کد تایید باید ۵ رقم باشد');
      return;
    }

    setIsLoading(true);
    try {
      // First verify the code and create session
      const result = await verifyCode({ data: { phoneNumber, code } });

      if (result.success) {
        // Get the current user after successful verification
        const user = await getCurrentUser();

        if (user) {
          // Sync cart with database (merges localStorage cart)
          const syncResult = await syncCart(user.id);

          if (!syncResult.success) {
            // Cart sync failed, but login was successful
            toast.error('خطا در همگام‌سازی سبد خرید، لطفاً صفحه را رفرش کنید');
          }
        }

        // Handle navigation based on profile completion
        if (result.needsProfile) {
          setStep('profile');
          toast.success('کد تایید شد، لطفا اطلاعات خود را تکمیل کنید');
        } else if (result.redirectTo) {
          toast.success('خوش آمدید!');
          router.navigate({ to: result.redirectTo });
        } else {
          toast.success('خوش آمدید!');
          router.navigate({ to: '/profile' });
        }
      }
    } catch (error) {
      toast.error(error.message || 'کد تایید نامعتبر است');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('نام و نام خانوادگی الزامی است');
      return;
    }

    setIsLoading(true);
    try {
      await completeProfile({ data: { firstName, lastName } });
      toast.success('اطلاعات شما ثبت شد');
      router.navigate({ to: '/profile' });
    } catch (error) {
      toast.error(error.message || 'خطا در ثبت اطلاعات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;

    setIsLoading(true);
    try {
      await sendVerificationCode({ data: { phoneNumber } });
      toast.success('کد جدید ارسال شد');
      setTimer(120);
    } catch (error) {
      toast.error(error.message || 'خطا در ارسال مجدد کد');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-background p-4'
      dir='rtl'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            {step === 'phone' && <Phone className='h-6 w-6 text-primary' />}
            {step === 'code' && (
              <CheckCircle className='h-6 w-6 text-primary' />
            )}
            {step === 'profile' && <User className='h-6 w-6 text-primary' />}
          </div>
          <CardTitle className='text-2xl'>
            {step === 'phone' && 'ورود به حساب'}
            {step === 'code' && 'تایید شماره تلفن'}
            {step === 'profile' && 'تکمیل اطلاعات'}
          </CardTitle>
          <CardDescription>
            {step === 'phone' &&
              'شماره تلفن خود را وارد کنید. (لازم نیست واقعی باشه ⚠️)'}
            {step === 'code' &&
              `کد ۵ رقمی ارسال شده به ${phoneNumber} را وارد کنید`}
            {step === 'profile' && 'لطفا نام و نام خانوادگی خود را وارد کنید'}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {step === 'phone' && (
            <>
              <div className='space-y-2'>
                <Label htmlFor='phone'>شماره تلفن</Label>
                <Input
                  id='phone'
                  type='tel'
                  placeholder='09123456789'
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className='text-left'
                  dir='ltr'
                />
              </div>
              <Button
                onClick={handleSendCode}
                disabled={isLoading}
                className='w-full'>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    ارسال کد تایید
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className='space-y-4'>
                <div className='flex justify-center'>
                  <InputOTP
                    maxLength={5}
                    value={code}
                    onChange={(value) => setCode(value)}>
                    <InputOTPGroup dir='ltr'>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {timer > 0 ? (
                  <p className='text-center text-sm text-muted-foreground'>
                    ارسال مجدد کد در {formatTimer(timer)}
                  </p>
                ) : (
                  <Button
                    variant='ghost'
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className='w-full'>
                    ارسال مجدد کد
                  </Button>
                )}

                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoading || code.length !== 5}
                  className='w-full'>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      در حال تایید...
                    </>
                  ) : (
                    <>
                      تایید کد
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </>
                  )}
                </Button>

                <Button
                  variant='outline'
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setTimer(0);
                  }}
                  disabled={isLoading}
                  className='w-full'>
                  تغییر شماره تلفن
                </Button>
              </div>
            </>
          )}

          {step === 'profile' && (
            <>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>نام</Label>
                  <Input
                    id='firstName'
                    type='text'
                    placeholder='نام خود را وارد کنید'
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='lastName'>نام خانوادگی</Label>
                  <Input
                    id='lastName'
                    type='text'
                    placeholder='نام خانوادگی خود را وارد کنید'
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCompleteProfile}
                  disabled={isLoading || !firstName.trim() || !lastName.trim()}
                  className='w-full'>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      تکمیل ثبت نام
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          <div className='text-center text-xs text-muted-foreground mt-6'>
            با ادامه، شما با قوانین و مقررات موافقت می‌کنید
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
