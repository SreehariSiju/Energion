import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap } from "lucide-react";

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// Corrected the import path to use the project's alias '@' which points to the 'src' directory
import { auth, db } from "@/firebase-config.js"; 

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && !formData.name) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Create a user document in Firestore to store their details
        await setDoc(doc(db, "users", user.uid), {
            name: formData.name,
            email: user.email,
            createdAt: serverTimestamp(),
            prepaidBalance_kWh: 0, // Start new users with 0 kWh
        });
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      const errorMessage = err.message ? err.message.replace("Firebase: ", "") : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated gradient-card">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Energion</h1>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isLogin ? "Welcome" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background"
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-background"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-background"
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="action" size="lg" className="w-full" disabled={loading}>
             {loading ? "Please wait..." : (isLogin ? "Login" : "Create Account")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline text-sm font-medium"
            disabled={loading}
          >
            {isLogin ? "Create Account" : "Already have an account? Login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;

