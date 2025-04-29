"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckIcon, XIcon, ChevronDownIcon, LoaderCircle } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useRouter } from "next/navigation";
import apiService from "../services/api";

import { toast } from "sonner"


interface Plan{
  name:string;
  price:number;
  period:string;
  description:string;
  features:string[];
} 
export default function PricingPageUI() {
  // 使用annually替代activeTab，使状态更加语义化
  const [annually, setAnnually] = useState(false);
  const [mounted, setMounted] = useState(false);
  // 添加支付确认对话框状态
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  // 保存当前选择的支付金额
  const [paymentAmount, setPaymentAmount] = useState("");
  // 当前选择的付款计划
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  // 添加加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 添加订单信息
  const [orderInfo, setOrderInfo] = useState(null);
  // 添加轮询状态
  const [isPolling, setIsPolling] = useState(false);
  // 添加轮询计数器，用于限制轮询次数
  const [pollingCount, setPollingCount] = useState(0);
  // 最大轮询次数 (5分钟，每10秒查询一次 = 30次)
  const MAX_POLLING_COUNT = 30;

  const [link_str, setLinkStr] = useState('');

  const router = useRouter();

  
  // 防止水合不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 支付状态轮询
  useEffect(() => {
    let pollingInterval:any;
    
    if (isPolling && orderInfo && pollingCount < MAX_POLLING_COUNT) {
      console.log("开始轮询支付状态，订单信息:", orderInfo);
      
      pollingInterval = setInterval(async () => {
        try {
          setPollingCount(prev => prev + 1);
          console.log(`第${pollingCount + 1}次查询支付状态`);
          
          const res = await apiService.alipay.checkOrder(orderInfo);
          console.log("支付状态查询结果:", res);
          
          if (res['paid']) {
            // 支付成功
            clearInterval(pollingInterval);
            setIsPolling(false);
            setShowPaymentDialog(false);
            
            // 更新会员状态
            try {
              const subscriptionType = selectedPlan?.name === "基础版" ? "basic" : "professional";
              const durationMonths = annually ? 12 : 1;
              await apiService.user.updateVip(subscriptionType, durationMonths);
              
              // 更新本地存储的用户信息
              const userStr = localStorage.getItem('user');
              if (userStr) {
                const user = JSON.parse(userStr);
                user.subscription_type = subscriptionType;
                user.subscription_start_date = new Date().toISOString();
                user.subscription_end_date = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
                // 设置配额
                if (subscriptionType === 'basic') {
                  user.remaining_chapters = 50;
                  user.remaining_books = 3;
                  user.remaining_outlines = 1;
                  user.remaining_inspirations = 10;
                } else if (subscriptionType === 'professional') {
                  user.remaining_chapters = 150;
                  user.remaining_books = 10;
                  user.remaining_outlines = 3;
                  user.remaining_inspirations = 30;
                }
                user.last_quota_reset_date = new Date().toISOString();
                localStorage.setItem('user', JSON.stringify(user));
              }
            } catch (error) {
              console.error("更新会员状态失败:", error);
            }
            
            // 显示成功消息
            toast("支付成功",
              {
                description: "您的订阅已经生效，即将跳转到主页",
                action:{
                  label:'确定',
                  onClick:()=>{}
                }
              });
            
            // 跳转到主页
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else if (pollingCount >= MAX_POLLING_COUNT) {
            // 超过最大轮询次数
            clearInterval(pollingInterval);
            setIsPolling(false);
            toast("支付未完成",{
              description: "请稍后再试",
              action: {
                label:"确定",
                onClick:()=>{}
              }
            });
          }
        } catch (error) {
          console.error("检查支付状态出错", error);
        }
      }, 10000); // 每10秒查询一次
    }
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [isPolling, orderInfo, pollingCount, router, selectedPlan, annually]);

  // 滚动动画容器
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // 滚动动画项目
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  

  // 修改处理点击函数，先显示确认对话框
  const handleSubscribeClick = async (plan: any, amount: string) => {
    setSelectedPlan(plan);
    setPaymentAmount(amount);

    // 判断是否登录（假设token存储在localStorage）
    const userToken = localStorage.getItem('token');
    if (!userToken) {
      // 未登录，提示用户，用户点击登录后，跳转到登录页
      toast("请先登录", {
        description: "请先登录后再进行支付",
        action: {
          label: "登录",
          onClick: () => {
            // 跳转到登录页
            localStorage.setItem("amount", amount);
            router.push('/auth?is_pay=true');
          }
        }
      });
      return;
    }

    // 已登录，继续支付逻辑
    try {
      setIsLoading(true);
      const newWindow = window.open('about:blank', '_blank');

      const response = await apiService.alipay.creat(amount);
      
      // 从响应中提取支付链接
      // 注意：后端返回的link格式为 "网页支付链接: [点击完成支付](实际链接)"
      const linkMatch = response.link.match(/\[点击完成支付\]\((.*?)\)/);
      if (!linkMatch) {
        throw new Error('支付链接格式错误');
      }
      
      const paymentLink = linkMatch[1];
      setLinkStr(paymentLink);
      
      // 保存订单信息
      setOrderInfo(response.order_info);

      console.log("paymentLink", paymentLink);
      
      // 打开支付页面
      if (newWindow) {
        newWindow.location.href = paymentLink;
        console.log("到这里了")
        // 如果支付页面未能成功打开，给用户提示
        if (newWindow.closed || !newWindow.opener) {
          toast("支付页面可能被浏览器拦截", {
            description: "请允许弹出窗口或使用下面的按钮手动打开支付页面",
          });
        }
      } else {
        // window.open返回null，可能是被浏览器拦截
        toast("支付页面被浏览器拦截", {
          description: "请允许弹出窗口或使用下面的按钮手动打开支付页面",
        });
      }
      
      // 关闭加载框，显示支付确认对话框
      setIsLoading(false);
      setShowPaymentDialog(true);
      
      // 开始轮询支付状态
      setIsPolling(true);
      setPollingCount(0);
      
    } catch (error) {
      setIsLoading(false);
      toast("发起支付失败", {
        description: "请稍后再试或联系客服",
        action: {
          label: '稍后',
          onClick: () => {}
        }
      });
      console.error("支付处理出错", error);
    }
  };

  // 确认支付处理
  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.alipay.checkOrder(orderInfo??"");
      
      if (res['paid']) {
        // 支付成功
        setShowPaymentDialog(false);
        setIsLoading(false);
        setIsPolling(false);

        // 修改会员状态
        const subscriptionType = selectedPlan?.name === "基础版" ? "basic" : "professional";
        const durationMonths = annually ? 12 : 1;
        await apiService.user.updateVip(subscriptionType, durationMonths);


        
        toast("支付成功",{
          description: "您的订阅已经生效，即将跳转到主页",
          action: {
            label:"确定",
            onClick:()=>{
                
            }
          }
        });
        
        // 跳转到主页
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setIsLoading(false);

        toast("支付未完成",{
            description: "请完成支付后再尝试，或稍后再试",
            action: {
              label:"确定",
              onClick:()=>{
                  
              }
            }
          });
      }
    } catch (error) {
      setIsLoading(false);
 

      toast("验证支付失败",{
        description: "请稍后再试或联系客服",
        action: {
          label:"确定",
          onClick:()=>{
              
          }
        }
      });
  }
      
    };

  // 手动检查支付状态
  const handleManualCheck = async () => {
    await handleConfirmPayment();
  };

  // 重新发起支付
  const handleRetryPayment = () => {
    if (selectedPlan) {
      const amount = annually ? selectedPlan.price?.toString() : selectedPlan.price?.toString();
      setShowPaymentDialog(false);
      
      // 短暂延迟后重新发起支付
      setTimeout(() => {
        handleSubscribeClick(selectedPlan, amount);
      }, 500);
    }
  };

  // 价格计划数据 - 包含月付和年付价格
  const plans = [
    {
      name: "免费试用",
      price: 0,
      period: "天",
      description: "体验AI创作的魅力",
      features: [
        "精细模式：3章节",
        "拆书模式：1本 (1万字)",
        "章法模式：1本 (3章)",
        "灵感模式：每天5次",
      ],
      popular: false,
      color: "bg-primary/10 dark:bg-primary/20",
      buttonColor: "bg-primary hover:bg-primary/90 border-primary",
      headerColor: "bg-primary/80 dark:bg-primary/90"
    },
    {
      name: "基础版",
      monthlyPrice: 98,
      yearlyPrice: 980, // 年付单价约为月付的83%，提供优惠
      description: "适合初级创作者",
      features: [
        "精细模式：每月50章节",
        "拆书模式：每月3本 (10万字/本)",
        "章法模式：每月1本 (10章)",
        "灵感模式：每天10次",
      ],
      popular: false,
      color: "bg-primary/5 dark:bg-primary/10",
      buttonColor: "bg-primary hover:bg-primary/90",
      headerColor: "bg-primary/80 dark:bg-primary/90"
    },
    {
      name: "专业版",
      monthlyPrice: 198,
      yearlyPrice: 1980, // 年付单价约为月付的83%，提供优惠
      description: "专业作家的理想选择",
      features: [
        "精细模式：每月150章节",
        "拆书模式：每月10本 (20万字/本)",
        "章法模式：每月3本 (20章/本)",
        "灵感模式：每天30次",
      ],
      popular: true,
      color: "bg-secondary/5 dark:bg-secondary/10",
      buttonColor: "bg-secondary hover:bg-secondary/90",
      headerColor: "bg-secondary/80 dark:bg-secondary/90"
    }
  ];

  // 避免水合不匹配
  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-background">
      {/* 加载状态覆盖层 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center">
            <LoaderCircle className="animate-spin h-10 w-10 text-primary mb-4" />
            <p className="text-foreground font-medium">处理中，请稍候...</p>
          </div>
        </div>
      )}
      
      {/* 支付确认对话框 */}
      <Dialog open={showPaymentDialog} onOpenChange={(open:any) => {
        if (!isLoading) {
          setShowPaymentDialog(open);
        }
      }}>
        {/* 自定义全屏蒙版 */}
        {showPaymentDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        )}
        <DialogContent className="sm:max-w-md z-50">
          <DialogHeader>
            <DialogTitle className="text-xl text-center font-bold">支付确认</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="bg-muted/30 p-6 rounded-lg mb-6 text-center">
              <h3 className="text-lg font-medium mb-2">您的支付已经发起</h3>
              <p className="text-muted-foreground mb-4">
                请在新打开的窗口中完成支付流程，支付完成后请点击下方按钮
              </p>
              
              <div className="flex items-center justify-center mb-2 text-primary">
                <p className="font-semibold text-lg">
                  {selectedPlan?.name} ({annually ? '年付' : '月付'})：
                  <span className="font-bold ml-1">¥{paymentAmount}</span>
                </p>
              </div>
              
              {/* 添加手动打开支付链接的按钮 */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  // 尝试重新打开支付页面
                  try {
                    window.location.href = link_str;
                  } catch (error) {
                    console.error("打开支付页面失败", error);
                  }
                }}
                className="mt-3 bg-primary/10 text-primary hover:bg-primary/20"
              >
                无法打开？点击这里重新打开支付页面
              </Button>
              
              {isPolling && (
                <p className="text-xs text-muted-foreground mt-2">
                  系统正在自动检查支付状态，您也可以手动点击验证
                </p>
              )}
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleManualCheck}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2"
              >
                我已完成支付
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleRetryPayment}
                  className="w-1/2"
                >
                  重新发起支付
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  className="w-1/2"
                >
                  稍后支付
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 顶部渐变背景 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 opacity-90 h-[500px]"></div>
        
        {/* 主题切换按钮 */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        
        {/* 顶部标题区域 */}
        <div className="relative pt-20 pb-32 text-center z-10">
          <motion.h1 
            className="text-4xl font-bold mb-2 text-foreground"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            AI小说创作系统
          </motion.h1>
          
          <motion.p 
            className="text-lg mb-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            让AI为您的创作插上翅膀
          </motion.p>
          
          <motion.div 
            className="flex justify-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Tabs 
              defaultValue={annually ? "yearly" : "monthly"} 
              value={annually ? "yearly" : "monthly"}
              className="w-[200px] bg-background/20 rounded-full p-1"
              onValueChange={(value) => setAnnually(value === "yearly")}
            >
              <TabsList className="grid w-full grid-cols-2 bg-transparent">
                <TabsTrigger 
                  value="monthly" 
                  className="data-[state=active]:bg-background data-[state=active]:text-primary text-background rounded-full transition-all duration-300"
                >
                  月付
                </TabsTrigger>
                <TabsTrigger 
                  value="yearly" 
                  className="data-[state=active]:bg-background data-[state=active]:text-primary text-background rounded-full transition-all duration-300"
                >
                  年付
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* 价格卡片区域 */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-20">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* 动态渲染价格卡片 */}
          {plans.map((plan, index) => (
            <motion.div 
              key={index} 
              variants={item} 
              whileHover={{ y: -8 }} 
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className={`${plan.color} shadow-xl rounded-2xl overflow-hidden border border-border h-full relative`}>
                {plan.popular && (
                  <div className="absolute top-0 right-5 bg-red-500 text-white px-3 py-1 rounded-b-lg text-xs font-semibold shadow-md">
                    热门选择
                  </div>
                )}
                <CardContent className="p-0">
                  <div className={`${plan.headerColor} p-6 text-center text-white`}>
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold">
                        ¥{plan.name === "免费试用" 
                          ? 0 
                          : annually 
                            ? plan.yearlyPrice 
                            : plan.monthlyPrice}
                      </span>
                      <span className="text-sm ml-1">/{plan.period || (annually ? '年' : '月')}</span>
                    </div>
                    {plan.name !== "免费试用" && annually && (
                      <div className="text-xs mt-1 bg-white/20 rounded-full px-2 py-0.5 inline-block">
                          相当于10000 元/月
                      </div>
                    )}
                    <p className="text-sm mt-2">{plan.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 ${plan.buttonColor} border-white border-1 text-white hover:cursor-pointer transition-all duration-300 hover:shadow-lg`} 
                      onClick={() => {
                        // 将处理逻辑移到新的函数中
                        const amount = annually ? plan.yearlyPrice?.toString() : plan.monthlyPrice?.toString();
                        // 免费版无需支付确认
                        if (plan.name === "免费试用") {
                          // 可以直接处理免费试用逻辑
                          router.push('/dashboard');
                        } else {
                          handleSubscribeClick(plan, amount??"");
                        }
                      }}
                    >
                      {plan.name === "免费试用" ? "开始免费试用" : "立即订阅"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>


      {/* 功能对比表格 - 保留原先表格内容，样式统一调整 */}
      <motion.div 
        className="max-w-4xl mx-auto mt-24 px-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2 className="text-2xl font-bold text-center mb-8">功能详细对比</h2>
        <div className="relative overflow-x-auto shadow-md rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-4 px-2 text-left">功能</th>
                <th className="text-center py-4 px-2">免费试用</th>
                <th className="text-center py-4 px-2">基础版</th>
                <th className="text-center py-4 px-2">专业版</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-4 px-2 text-primary">精细模式</td>
                <td className="text-center py-4 px-2">3章节</td>
                <td className="text-center py-4 px-2">每月50章节</td>
                <td className="text-center py-4 px-2">每月150章节</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-4 px-2 text-primary">拆书模式</td>
                <td className="text-center py-4 px-2">1本<br/>(1万字)</td>
                <td className="text-center py-4 px-2">每月3本<br/>(10万字/本)</td>
                <td className="text-center py-4 px-2">每月10本<br/>(20万字/本)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-4 px-2 text-primary">章法模式</td>
                <td className="text-center py-4 px-2">1本(3章)</td>
                <td className="text-center py-4 px-2">1本/月<br/>(10章)</td>
                <td className="text-center py-4 px-2">3本/月<br/>(20章/本)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-4 px-2 text-primary">灵感模式</td>
                <td className="text-center py-4 px-2">5次/天</td>
                <td className="text-center py-4 px-2">10次/天</td>
                <td className="text-center py-4 px-2">30次/天</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* FAQ部分 */}
      <div className="max-w-3xl mx-auto mt-24 px-4">
        <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1" className="border border-border rounded-lg overflow-hidden shadow-sm">
            <AccordionTrigger className="px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-all">
              <span className="text-left font-medium">如何选择适合我的方案？</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <p className="text-muted-foreground">
                根据您的创作频率和需求选择：免费试用适合体验功能，基础版适合初级创作者或偶尔创作，专业版适合频繁创作的专业作家。
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="border border-border rounded-lg overflow-hidden shadow-sm">
            <AccordionTrigger className="px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-all">
              <span className="text-left font-medium">年付方案是否可以退款？</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <p className="text-muted-foreground">
                年付方案在购买后14天内可申请全额退款。超过14天，我们将按照已使用时间比例扣除费用后退还剩余金额。
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3" className="border border-border rounded-lg overflow-hidden shadow-sm">
            <AccordionTrigger className="px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-all">
              <span className="text-left font-medium">创作的内容版权归属？</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <p className="text-muted-foreground">
                所有通过我们平台创作的内容版权完全归您所有。我们不会对您创作的内容主张任何权利。
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* CTA部分 */}
      <div className="mt-24 mb-16 max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-primary/80 to-secondary/80 rounded-2xl shadow-xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">准备好开始您的创作之旅了吗？</h2>
          <p className="text-lg mb-6 opacity-90">注册即可获得7天免费试用，感受AI辅助创作的魅力</p>
          <Button size="lg" className="bg-white text-sec hover:bg-white/90 shadow-lg">
            立即开始免费试用
          </Button>
        </div>
      </div>
    </div>
  );

} 