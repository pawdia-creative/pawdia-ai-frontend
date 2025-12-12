import { Upload, Wand2, Coins, Truck } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Photo",
    description: "Upload a clear photo of your pet",
  },
  {
    icon: Wand2,
    number: "02",
    title: "Choose Style",
    description: "Select from 50+ artistic styles",
  },
  {
    icon: Coins,
    number: "03",
    title: "Purchase Credits",
    description: "Use credits to generate AI art",
  },
  {
    icon: Truck,
    number: "04",
    title: "Fast Generation",
    description: "Quick AI processing with instant results - get your artwork in minutes, not days",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From photo to AI-generated art in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-accent" />
              )}
              
              {/* Step content */}
              <div className="relative">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full gradient-primary mb-6 shadow-glow">
                  <step.icon className="w-12 h-12 text-primary-foreground" />
                </div>
                <div className="absolute top-2 right-1/4 bg-accent text-accent-foreground w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-soft">
                  {step.number}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
