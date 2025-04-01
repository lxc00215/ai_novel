'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, CircleHelp, Clock, CreditCard, Shield } from 'lucide-react';
import Image from 'next/image';

// Define plan types and features
interface Feature {
  title: string;
  available: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number | null;
  description: string;
  features: Feature[];
  recommended?: boolean;
  custom?: boolean;
  periodicity: 'monthly' | 'yearly' | 'custom';
  ctaText: string;
}

const PricingPage: React.FC = () => {
  // State for countdown timer
  const [countdown, setCountdown] = useState({
    days: 7,
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  // State for showing promotion banner
  const [showPromotionBanner, setShowPromotionBanner] = useState(true);

  // State for current periodicity (monthly/yearly)
  const [periodicity, setPeriodicity] = useState<'monthly' | 'yearly'>('monthly');

  // Define plans
  const plans: Plan[] = [
    {
      id: 'monthly-creator',
      name: '免费用户',
      originalPrice: 0,
      discountedPrice: 0,
      description: '适合偶尔创作、尝试性使用',
      periodicity: 'monthly',
      ctaText: '立即开始',
      features: [
        { title: 'AI拆书分析（每月5本限制）', available: true },
        { title: '短篇小说一键生成（每月3篇限制）', available: true },
        { title: '创作灵感提供', available: true },
        { title: '基础编辑功能', available: true },
        { title: '有限存储空间（5GB）', available: true },
        { title: '优先客户支持', available: false },
      ],
    },
    {
      id: 'yearly-writer',
      name: '月度创作者',
      originalPrice: periodicity === 'monthly' ? 50 : 480,
      discountedPrice: periodicity === 'monthly' ? 40 : 384,
      description: '适合持续创作的用户',
      periodicity: 'monthly',
      recommended: true,
      ctaText: '立即开始',
      features: [
        { title: '无限AI拆书分析', available: true, highlight: true },
        { title: '中长篇小说生成', available: true, highlight: true },
        { title: '高级创作灵感库', available: true },
        { title: '完整编辑工具套件', available: true },
        { title: '扩展存储空间（50GB）', available: true },
        { title: '优先客户支持', available: true },
      ],
    },
    {
      id: 'professional',
      name: '专业定制',
      originalPrice: 0,
      discountedPrice: null,
      description: '适合专业作家、出版机构',
      periodicity: 'custom',
      custom: true,
      ctaText: '联系我们获取报价',
      features: [
        { title: '全部功能无限制使用', available: true },
        { title: '定制化创作模板', available: true },
        { title: '商业出版权', available: true },
        { title: '专属客户经理', available: true },
        { title: 'API访问权限', available: true },
        { title: '品牌定制选项', available: true },
      ],
    },
  ];

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          return { ...prev, seconds: seconds - 1 };
        } else if (minutes > 0) {
          return { ...prev, minutes: minutes - 1, seconds: 59 };
        } else if (hours > 0) {
          return { ...prev, hours: hours - 1, minutes: 59, seconds: 59 };
        } else if (days > 0) {
          return { ...prev, days: days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        
        // If countdown reaches zero, hide promotion
        setShowPromotionBanner(false);
        clearInterval(timer);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // FAQ items
  const faqItems = [
    {
      question: '不同套餐之间有什么区别？',
      answer: '各套餐主要在AI创作次数、存储空间及高级功能方面有所不同。月度创作者适合初次尝试，年度作家提供更多高级功能且价格更优惠，专业定制则为严肃创作者提供无限制全功能体验。',
    },
    {
      question: '如果不满意，可以退款吗？',
      answer: '是的，我们提供7天无理由退款保证。如果您对服务不满意，可以在购买后7天内申请全额退款。',
    },
    {
      question: '可以随时升级套餐吗？',
      answer: '可以。您可以随时从月度创作者升级到年度作家或专业定制方案。升级时，我们会按比例计算剩余时间的费用差额。',
    },
    {
      question: '如何使用优惠码？',
      answer: '在结账页面，您会看到"输入优惠码"的选项。输入您的优惠码并点击应用即可获得相应折扣。',
    },
    {
      question: '商业出版需要什么授权？',
      answer: '使用我们系统创作的作品，月度和年度计划用户可用于个人发表，但商业出版需要专业定制方案中的商业出版授权。详情请联系我们的客户服务。',
    },
  ];

  // Payment methods
  const paymentMethods = [
    { name: '微信支付', icon: '/images/wechat-pay.svg' },
    { name: '支付宝', icon: '/images/alipay.svg' },
    { name: '银联', icon: '/images/unionpay.svg' },
  ];

  const formatPrice = (price: number) => {
    return `¥${price}${periodicity === 'yearly' ? '/年' : '/月'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 z-0"
        style={{
          backgroundImage: 'url(/images/paper-texture.png)', 
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply'
        }}
      />

      {/* Promotion banner */}
      {showPromotionBanner && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-3 text-center relative">
          <div className="container mx-auto flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">限时优惠：</span>
              <span className="font-bold">{countdown.days}天 {countdown.hours}小时 {countdown.minutes}分 {countdown.seconds}秒</span>
            </div>
            <div className="font-semibold">所有计划8折优惠！</div>
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
              onClick={() => setShowPromotionBanner(false)}
              aria-label="关闭促销信息"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">选择适合您创作旅程的方案</h1>
          <p className="text-xl text-blue-700 max-w-3xl mx-auto">
            AI驱动的小说创作助手，让您的创意不再受限
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-12">
          <Tabs defaultValue="monthly" className="w-64" onValueChange={(value) => setPeriodicity(value as 'monthly' | 'yearly')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">月付</TabsTrigger>
              <TabsTrigger value="yearly">年付</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`transition-all duration-300 relative overflow-hidden flex flex-col ${
                plan.recommended 
                  ? 'border-2 border-blue-500 shadow-lg shadow-blue-100 transform md:scale-105' 
                  : 'border border-gray-200'
              }`}
            >
              {plan.recommended && (
                <Badge className="absolute right-4 top-4 bg-gold-500 hover:bg-gold-600 text-white">推荐方案</Badge>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-blue-900">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow">
                {/* Price */}
                <div className="mb-6">
                  {plan.custom ? (
                    <div className="text-2xl font-bold text-blue-900">根据需求定制</div>
                  ) : (
                    <>
                      {plan.discountedPrice !== null && (
                        <div className="relative mb-1">
                          <Badge className="bg-red-500 hover:bg-red-600 mb-1">限时优惠</Badge>
                          <div className="text-3xl font-bold text-blue-900">{formatPrice(plan.discountedPrice)}</div>
                          <div className="text-lg text-gray-500 line-through">{formatPrice(plan.originalPrice)}</div>
                        </div>
                      )}
                      {plan.periodicity === 'yearly' && (
                        <Badge className="bg-green-500 hover:bg-green-600">节省20%</Badge>
                      )}
                    </>
                  )}
                </div>
                
                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mr-2 flex-shrink-0 ${
                        feature.available 
                          ? feature.highlight 
                            ? 'text-blue-600' 
                            : 'text-green-500' 
                          : 'text-gray-300'
                      }`} />
                      <span className={`text-sm ${
                        feature.highlight ? 'font-bold text-blue-800' : feature.available ? 'text-gray-700' : 'text-gray-400 line-through'
                      }`}>{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button className={`w-full ${
                  plan.recommended 
                    ? 'bg-blue-700 hover:bg-blue-800' 
                    : plan.custom ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}>
                  {plan.ctaText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Social proof */}
        <div className="bg-blue-50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">超过10,000名作家的选择</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-700 italic mb-4">"使用这个平台后，我的创作效率提高了300%，轻松完成了我的处女作。"</p>
              <div className="font-semibold">王小明 — 《城市夜语》作者</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-700 italic mb-4">"AI分析功能帮我解决了长期的创作瓶颈，现在写作变得如此流畅。"</p>
              <div className="font-semibold">李晓华 — 《记忆碎片》作者</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-700 italic mb-4">"专业定制方案为我们出版社带来了革命性的改变，编辑效率提升显著。"</p>
              <div className="font-semibold">张总监 — 未来文学出版社</div>
            </div>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">功能对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-4 text-left border border-blue-800">功能</th>
                  <th className="p-4 text-center border border-blue-800">月度创作者</th>
                  <th className="p-4 text-center border border-blue-800 bg-blue-800">年度作家</th>
                  <th className="p-4 text-center border border-blue-800">专业定制</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="p-4 border border-gray-200">AI拆书分析</td>
                  <td className="p-4 text-center border border-gray-200">每月5本</td>
                  <td className="p-4 text-center border border-gray-200 bg-blue-50">无限</td>
                  <td className="p-4 text-center border border-gray-200">无限</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 border border-gray-200">小说生成</td>
                  <td className="p-4 text-center border border-gray-200">短篇（每月3篇）</td>
                  <td className="p-4 text-center border border-gray-200 bg-blue-50">中长篇（无限）</td>
                  <td className="p-4 text-center border border-gray-200">无限制</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 border border-gray-200">存储空间</td>
                  <td className="p-4 text-center border border-gray-200">5GB</td>
                  <td className="p-4 text-center border border-gray-200 bg-blue-50">50GB</td>
                  <td className="p-4 text-center border border-gray-200">定制</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 border border-gray-200">客户支持</td>
                  <td className="p-4 text-center border border-gray-200">邮件支持</td>
                  <td className="p-4 text-center border border-gray-200 bg-blue-50">优先支持</td>
                  <td className="p-4 text-center border border-gray-200">专属经理</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 border border-gray-200">商业出版权</td>
                  <td className="p-4 text-center border border-gray-200">❌</td>
                  <td className="p-4 text-center border border-gray-200 bg-blue-50">❌</td>
                  <td className="p-4 text-center border border-gray-200">✅</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 border border-gray-200">API访问</td>
                  <td className="p-4 text-center border border-gray-200">❌</td>
                  <td className="p-4 text-center border border-gray-200 bg-blue-50">❌</td>
                  <td className="p-4 text-center border border-gray-200">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">支付方式</h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full p-2 shadow-md flex items-center justify-center mb-2">
                  {/* Replace with actual images in production */}
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                </div>
                <span className="text-sm text-gray-700">{method.name}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-1" />
              <span>安全支付保障</span>
            </div>
          </div>
        </div>

        {/* Coupon code */}
        <div className="max-w-md mx-auto mb-16">
          <h2 className="text-xl font-bold text-blue-900 mb-4 text-center">拥有优惠码？</h2>
          <div className="flex">
            <Input placeholder="输入优惠码" className="rounded-r-none" />
            <Button className="rounded-l-none">应用</Button>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">常见问题</h2>
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-medium text-blue-800">{item.question}</AccordionTrigger>
                <AccordionContent className="text-gray-700">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* 7-day guarantee */}
        <div className="bg-blue-50 rounded-xl p-8 mb-16 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="flex items-center justify-center bg-white rounded-full w-20 h-20 shadow">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-blue-900 mb-2">7天无风险试用保证</h3>
            <p className="text-blue-700">如果您对我们的服务不满意，购买后7天内可申请全额退款，无需任何理由。</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">准备开始您的创作之旅？</h2>
          <p className="text-xl text-blue-700 mb-6 max-w-2xl mx-auto">选择适合您的计划，立即释放AI辅助创作的力量</p>
          <Button className="bg-blue-800 hover:bg-blue-900 text-lg py-6 px-8">开始免费试用</Button>
          <p className="mt-4 text-sm text-gray-600">无需信用卡，7天后自动升级或取消</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 AI小说创作助手. 保留所有权利。</p>
          <div className="flex justify-center mt-4 space-x-4">
            <a href="#" className="hover:underline">隐私政策</a>
            <a href="#" className="hover:underline">服务条款</a>
            <a href="#" className="hover:underline">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;