import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Snowflake,
  Star,
  Sparkles,
  ShoppingBag,
  Heart,
  Shield,
  Truck,
  Award,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type SnowflakeType = {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
};

export default function PersianEcommerceLanding() {
  const [snowflakes, setSnowflakes] = useState<SnowflakeType[]>([]);

  // Initialize snowflakes
  useEffect(() => {
    const initSnowflakes: SnowflakeType[] = [...Array(15)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100,
      speed: 0.5 + Math.random() * 1,
      size: 0.5 + Math.random() * 0.8,
      opacity: 0.3 + Math.random() * 0.4,
    }));
    setSnowflakes(initSnowflakes);
  }, []);

  // Animate snowflakes
  useEffect(() => {
    const animateSnowflakes = () => {
      setSnowflakes((prev) =>
        prev.map((flake) => ({
          ...flake,
          y: flake.y > 110 ? -10 : flake.y + flake.speed,
        }))
      );
    };

    const interval = setInterval(animateSnowflakes, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className='min-h-screen bg-gradient-to-b from-background via-card to-background relative overflow-hidden'
      dir='rtl'
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Animated Background Elements */}
      <div className='absolute inset-0 pointer-events-none'>
        {/* Falling Snowflakes */}
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className='absolute transition-all duration-75 ease-linear'
            style={{
              left: `${flake.x}%`,
              top: `${flake.y}%`,
              opacity: flake.opacity,
              transform: `scale(${flake.size})`,
            }}>
            <Snowflake
              className='w-4 h-4 text-primary animate-spin'
              style={{ animationDuration: '8s', animationDirection: 'reverse' }}
            />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className='relative px-4 py-20 text-center'>
        <div className='max-w-4xl mx-auto'>
          {/* Logo Effect */}
          <div className='relative mb-8'>
            <h1 className='text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent'>
              Crystalholm
            </h1>
            <div className='absolute -top-4 -left-4'>
              <Sparkles className='w-8 h-8 text-primary animate-bounce' />
            </div>
            <div className='absolute -bottom-2 -right-6'>
              <Star className='w-6 h-6 text-accent animate-pulse' />
            </div>
          </div>

          <p className='text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed'>
            جایی که کیفیت با قیمت مناسب ملاقات می‌کند. مجموعه منحصر به فرد ما از
            <span className='text-primary font-semibold'>
              {' '}
              محصولات باکیفیت
            </span>{' '}
            و<span className='text-accent font-semibold'> خدمات درجه یک</span>
            را کشف کنید.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
            <Button size='lg' className='group relative overflow-hidden'>
              <span className='relative z-10 flex items-center gap-2'>
                <ShoppingBag className='w-5 h-5' />
                مشاهده محصولات
              </span>
              <div className='absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='border-primary/30 hover:bg-primary/10 bg-transparent'>
              کاتالوگ محصولات
            </Button>
          </div>

          {/* Floating Stats */}
          <div className='grid grid-cols-3 gap-8 max-w-md mx-auto'>
            {[
              { number: '۱۰ هزار+', label: 'مشتری راضی' },
              { number: '۵۰۰+', label: 'محصول' },
              { number: '۴.۹★', label: 'امتیاز' },
            ].map((stat, i) => (
              <div key={i} className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {stat.number}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className='px-4 py-16'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <Badge variant='secondary' className='mb-4'>
              <Snowflake className='w-4 h-4 ml-2' />
              دسته‌بندی محصولات
            </Badge>
            <h2 className='text-4xl font-bold mb-4'>محصولات ویژه</h2>
            <p className='text-muted-foreground max-w-2xl mx-auto'>
              هر محصول در مجموعه ما با دقت و کیفیت بالا انتخاب شده است
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                title: 'لوازم الکترونیکی',
                description:
                  'جدیدترین گجت‌ها و لوازم الکترونیکی با بهترین قیمت',
                image: '/electronics.jpg',
                badge: 'پرفروش',
              },
              {
                title: 'پوشاک و مد',
                description: 'آخرین مد روز با کیفیت عالی و قیمت‌های مناسب',
                image: '/fashion.jpg',
                badge: 'جدید',
              },
              {
                title: 'خانه و آشپزخانه',
                description:
                  'لوازم خانه که زندگی شما را راحت‌تر و زیباتر می‌کند',
                image: '/home-kitchen.jpg',
                badge: 'محبوب',
              },
            ].map((category, i) => (
              <Card
                key={i}
                className='group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden'>
                <div className='relative'>
                  <img
                    src={category.image || '/placeholder.svg'}
                    alt={category.title}
                    className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                  <Badge className='absolute top-4 left-4 bg-primary/90 text-primary-foreground'>
                    {category.badge}
                  </Badge>
                  <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                </div>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-semibold mb-2 group-hover:text-primary transition-colors'>
                    {category.title}
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    {category.description}
                  </p>
                  <Button
                    variant='ghost'
                    className='w-full group-hover:bg-primary/10'>
                    مشاهده دسته‌بندی
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='px-4 py-16 bg-card/30'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-4xl font-bold mb-4'>
              چرا کریستال هولم را انتخاب کنیم؟
            </h2>
            <p className='text-muted-foreground'>
              تجربه خرید بی‌نظیر را با ما تجربه کنید
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {[
              {
                icon: Shield,
                title: 'کیفیت مطمئن',
                description:
                  'هر محصول با دقت و استانداردهای بالا انتخاب شده است',
              },
              {
                icon: Truck,
                title: 'ارسال سریع',
                description: 'تحویل سریع و مطمئن در سریع‌ترین زمان ممکن',
              },
              {
                icon: Heart,
                title: 'رضایت مشتری',
                description: 'هزاران مشتری راضی از خدمات ما هستند',
              },
              {
                icon: Award,
                title: 'برند برتر',
                description: 'برندی مطرح در زمینه فروش آنلاین محصولات باکیفیت',
              },
            ].map((feature, i) => (
              <div key={i} className='text-center group'>
                <div className='w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                  <feature.icon className='w-8 h-8 text-primary' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>{feature.title}</h3>
                <p className='text-muted-foreground text-sm'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className='px-4 py-16'>
        <div className='max-w-4xl mx-auto text-center'>
          <Card className='p-8 bg-gradient-to-r from-card via-primary/5 to-card border-primary/20'>
            <CardContent className='p-0'>
              <Snowflake
                className='w-12 h-12 text-primary mx-auto mb-4 animate-spin'
                style={{ animationDuration: '10s' }}
              />
              <h2 className='text-3xl font-bold mb-4'>
                عضو خانواده کریستال هولم شوید
              </h2>
              <p className='text-muted-foreground mb-6 max-w-2xl mx-auto'>
                اولین نفری باشید که از جدیدترین محصولات، تخفیف‌های ویژه و
                پیشنهادات استثنایی باخبر می‌شوید
              </p>
              <div className='flex flex-col sm:flex-row gap-4 max-w-md mx-auto'>
                <input
                  type='email'
                  placeholder='ایمیل خود را وارد کنید'
                  className='flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50'
                  dir='ltr'
                />
                <Button className='bg-primary hover:bg-primary/90'>
                  عضویت در خبرنامه
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-4 py-20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-4xl md:text-5xl font-bold mb-6'>
            آماده تجربه خرید
            <span className='text-primary'> بی‌نظیر</span> هستید؟
          </h2>
          <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
            به کریستال هولم بپیوندید و دنیایی از محصولات باکیفیت و خدمات درجه یک
            را کشف کنید
          </p>
          <Button size='lg' className='group relative overflow-hidden'>
            <span className='relative z-10 flex items-center gap-2'>
              <ShoppingBag className='w-5 h-5' />
              شروع خرید
            </span>
            <div className='absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          </Button>
        </div>
      </section>
    </div>
  );
}
