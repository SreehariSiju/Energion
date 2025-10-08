import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import BottomNav from "@/components/BottomNav";
import { User, Mail, Phone, CreditCard, LogOut } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  plan: string;
  remaining: number;
}

const Profile = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">User Profile</h1>
            </div>
          </div>
        </div>

        <Card className="p-6 shadow-card gradient-card mb-6">
          <h2 className="text-3xl font-bold mb-6">{user.name}</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-medium capitalize">{user.plan}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="font-medium">{user.remaining} kWh</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card gradient-card mb-4">
          <h3 className="text-xl font-semibold mb-4">Contact Charger Team</h3>

          <div className="space-y-3">
            <a
              href="mailto:support@energion.com"
              className="flex items-center gap-3 text-primary hover:underline"
            >
              <Mail className="w-5 h-5" />
              <span>support@energion.com</span>
            </a>

            <a
              href="tel:+911234567890"
              className="flex items-center gap-3 text-primary hover:underline"
            >
              <Phone className="w-5 h-5" />
              <span>Call: 123-456-7890</span>
            </a>
          </div>
        </Card>

        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
