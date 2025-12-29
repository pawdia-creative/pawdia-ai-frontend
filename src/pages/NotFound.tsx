import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MetaTags } from "@/components/SEO/MetaTags";
import { Home, Sparkles, Image, DollarSign } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <MetaTags
        title="404 - Page Not Found | Pawdia AI"
        description="The page you're looking for doesn't exist. Return to Pawdia AI to create beautiful AI pet portraits."
        noindex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="text-center max-w-2xl">
          <h1 className="mb-4 text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            404
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Oops! The page you're looking for doesn't exist.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Link
              to="/"
              className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border hover:shadow-lg transition-shadow"
            >
              <Home className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Home</div>
                <div className="text-sm text-muted-foreground">Return to homepage</div>
              </div>
            </Link>
            
            <Link
              to="/create"
              className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border hover:shadow-lg transition-shadow"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Create Portrait</div>
                <div className="text-sm text-muted-foreground">Start creating</div>
              </div>
            </Link>
            
            <Link
              to="/examples"
              className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border hover:shadow-lg transition-shadow"
            >
              <Image className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Examples</div>
                <div className="text-sm text-muted-foreground">View gallery</div>
              </div>
            </Link>
            
            <Link
              to="/pricing"
              className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border hover:shadow-lg transition-shadow"
            >
              <DollarSign className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Pricing</div>
                <div className="text-sm text-muted-foreground">View plans</div>
              </div>
            </Link>
          </div>
          
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />
          Return to Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
