import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/settings/faq")({
  component: FAQPage,
});

function FAQPage() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How accurate is the skin analysis?",
      answer: "Our AI uses advanced computer vision trained on millions of dermatological images. While highly accurate for identifying common concerns like wrinkles, pores, and dark spots, it is not a substitute for professional medical advice.",
    },
    {
      question: "How do I change my language?",
      answer: "Go to Settings > Units & Language. From there, you can select your preferred language. The app will automatically translate the interface for you.",
    },
    {
      question: "Is my photo data secure?",
      answer: "Yes! We take your privacy very seriously. Photos are processed securely and you can choose whether or not to save them to your history. We never sell your personal data.",
    },
    {
      question: "How often should I scan my face?",
      answer: "For best tracking, we recommend scanning once a week in the morning, under consistent natural lighting before applying any skincare products.",
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can manage your subscription by going to Settings > Account & Security > Subscription Management. If you subscribed via Apple or Google, you must cancel through their respective app stores.",
    }
  ];

  return (
    <DeviceFrame
      title="FAQ & Guides"
      leftSlot={
        <button
          className="icon-button"
          aria-label="Back"
          onClick={() => navigate({ to: "/settings/support" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      }
    >
      <div className="p-4 pt-6">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
        
        <div className="rounded-2xl border border-border/70 bg-card p-2 shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b-border/60 last:border-0">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 rounded-2xl bg-primary/10 p-5 text-center">
          <h3 className="mb-2 font-semibold text-primary">Still need help?</h3>
          <p className="mb-4 text-xs text-primary/80">If you couldn't find the answer you were looking for, please reach out to our team.</p>
          <button 
            onClick={() => window.location.href = "mailto:support@sknpop.ai"}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Contact Support
          </button>
        </div>
      </div>
    </DeviceFrame>
  );
}
