import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast({
                title: "Error",
                description: "Please enter your email address",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setIsSubmitted(true);
            toast({
                title: "Success",
                description: "Password reset link sent to your email",
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message ?? "Failed to send reset email",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-border/50 shadow-lg animate-fade-in text-center">
                    <CardHeader className="pb-4">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-success" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
                        <CardDescription className="text-muted-foreground text-center">
                            A password reset link has been sent to <span className="font-semibold text-foreground">{email}</span>.
                            Please follow the instructions in the email to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate("/auth")}
                        >
                            Back to Sign In
                        </Button>
                        <button
                            type="button"
                            onClick={() => setIsSubmitted(false)}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Didn't receive the email? Try again
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 text-foreground">
            <Card className="w-full max-w-md border-border/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                        <Logo size="sm" rounded alt="GreenB" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Reset Password
                    </CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background border-input"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
                                    Sending Link...
                                </span>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>

                        <Link
                            to="/auth"
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;
