import { Button } from "./ui/button";
import { Ship, TrendingUp, Shield, Clock } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <div className="mb-2">
            <span className="inline-block px-4 py-2 bg-blue-600/30 backdrop-blur-sm rounded-full text-sm font-semibold mb-2 border border-blue-400/30">
              Freight & Finance Management
            </span>
            <h1
              className="text-5xl md:text-6xl font-extrabold mb-2 leading-snug relative z-10
              [text-shadow:_2px_2px_4px_rgba(0,0,0,0.4),_0_0_10px_rgba(59,130,246,0.6)]"
            >
              Streamline Your
              <span
                className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent leading-snug relative
                [text-shadow:_1px_1px_2px_rgba(0,0,0,0.35),_0_0_6px_rgba(34,211,238,0.4)]"
              >
                Cargo Accounting
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-2 max-w-2xl mx-auto">
              Comprehensive financial management for logistics operations. Track
              shipments, manage invoices, and control costs all in one platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            <Button
              size="lg"
              className="bg-white text-blue-900 hover:bg-blue-50"
            >
              Get Started
            </Button>
            {/*  <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Watch Demo
            </Button>*/}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 z-20">
              <Ship className="h-10 w-10 mb-4 text-blue-300" />
              <h3 className="font-semibold mb-2">Shipment Tracking</h3>
              <p className="text-sm text-blue-100">
                Real-time cargo monitoring
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 z-20">
              <TrendingUp className="h-10 w-10 mb-4 text-green-300" />
              <h3 className="font-semibold mb-2">Financial Reports</h3>
              <p className="text-sm text-blue-100">
                Detailed analytics & insights
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Shield className="h-10 w-10 mb-4 text-purple-300" />
              <h3 className="font-semibold mb-2">Secure Access</h3>
              <p className="text-sm text-blue-100">Role-based permissions</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Clock className="h-10 w-10 mb-4 text-yellow-300" />
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-blue-100">Always here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1010 91"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
