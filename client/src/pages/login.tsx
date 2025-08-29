import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import logoImage from "@assets/FC오리엔탈_배경1_1756466321842.png";

const loginSchema = z.object({
  username: z.string().min(1, "사용자명을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      await login(data.username, data.password);
      toast({
        title: "로그인 성공",
        description: "FC ORIENTAL 관리 시스템에 로그인되었습니다.",
      });
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "사용자명 또는 비밀번호를 확인하세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={logoImage} 
              alt="FC ORIENTAL Logo" 
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FC ORIENTAL</h1>
            <p className="text-sm text-muted-foreground">풋살 동호회 관리 시스템</p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사용자명</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-username"
                        placeholder="사용자명을 입력하세요" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-password"
                        type="password"
                        placeholder="비밀번호를 입력하세요" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                data-testid="button-login"
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-accent"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center mb-2">테스트 계정</p>
            <div className="text-xs text-center space-y-1">
              <div>관리자: admin / admin123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}