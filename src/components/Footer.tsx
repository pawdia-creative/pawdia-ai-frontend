// @ts-ignore
import { Heart, XIcon as X, Mail, Instagram } from "lucide-react"; 
 import { useState } from "react"; 
 
 export const Footer = () => { 
  const [showContactModal, setShowContactModal] = useState(false);
 
   const closeModal = () => { 
     setShowContactModal(false); 
   }; 
 
   return ( 
     <> 
       <footer className="border-t py-8 px-4"> 
         <div className="container mx-auto"> 
           <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4"> 
             <div className="flex items-center gap-2"> 
               <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent font-extrabold"> 
                 Pawdia AI 
               </span> 
             </div> 
             
             <div className="flex flex-col items-center text-center gap-1"> 
               <div className="flex items-center gap-2 text-sm text-muted-foreground"> 
                 <span>Made with</span> 
                 <Heart className="w-4 h-4 text-accent fill-accent" /> 
                 <span>for pet lovers worldwide</span> 
               </div> 
               <div className="text-xs text-muted-foreground"> 
                 © 2025 Pawdia AI. All rights reserved. 
               </div> 
             </div> 
             
             <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm text-muted-foreground"> 
              <a href="/about" className="hover:text-primary transition-smooth text-center">About</a>
              <a href="/examples" className="hover:text-primary transition-smooth text-center">Examples</a>
              <a href="/pricing" className="hover:text-primary transition-smooth text-center">Pricing</a>
              <a href="/blog" className="hover:text-primary transition-smooth text-center">Blog</a>
              <a href="/contact" className="hover:text-primary transition-smooth text-center">Contact</a>
               <a href="/privacy" className="hover:text-primary transition-smooth text-center">Privacy Policy</a> 
               <a href="/terms" className="hover:text-primary transition-smooth text-center">Terms of Service</a> 
             </div> 
           </div> 
         </div> 
       </footer> 
 
       {/* Contact Modal */} 
       {showContactModal && ( 
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> 
           <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"> 
             {/* Close Button */} 
             <button 
               onClick={closeModal} 
               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-smooth" 
             > 
               <X className="w-5 h-5" /> 
             </button> 
             
             {/* Modal Header */} 
             <div className="text-center mb-6"> 
               <h3 className="text-xl font-semibold text-gray-900">Contact Us</h3> 
               <p className="text-sm text-gray-600 mt-1"> 
                 Get in touch with Pawdia AI team 
               </p> 
             </div> 
             
             {/* Contact Information */} 
             <div className="space-y-4"> 
               {/* Instagram */} 
               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg"> 
                 <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full"> 
                   <Instagram className="w-5 h-5 text-white" /> 
                 </div> 
                 <div> 
                   <p className="text-sm font-medium text-gray-900">Instagram</p> 
                   <p className="text-sm text-gray-600">pawdia.creative</p> 
                 </div> 
               </div> 
               
               {/* Gmail */} 
               <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-blue-50 rounded-lg"> 
                 <div className="bg-gradient-to-r from-red-500 to-blue-600 p-2 rounded-full"> 
                   <Mail className="w-5 h-5 text-white" /> 
                 </div> 
                 <div> 
                   <p className="text-sm font-medium text-gray-900">Gmail</p> 
                   <p className="text-sm text-gray-600">pawdia.creative@gmail.com</p> 
                 </div> 
               </div> 
             </div> 
             
             {/* Action Buttons */} 
             <div className="flex gap-3 mt-6"> 
               <button 
                 onClick={() => window.open('https://instagram.com/pawdia.creative', '_blank')} 
                 className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-md hover:from-pink-600 hover:to-purple-700 transition-smooth text-sm font-medium" 
               > 
                 Follow on Instagram 
               </button> 
               <button 
                 onClick={() => window.open('mailto:pawdia.creative@gmail.com', '_blank')} 
                 className="flex-1 bg-gradient-to-r from-red-500 to-blue-600 text-white py-2 px-4 rounded-md hover:from-red-600 hover:to-blue-700 transition-smooth text-sm font-medium" 
               > 
                 Send Email 
               </button> 
             </div> 
             
             {/* Additional Info */} 
             <div className="text-center mt-4"> 
               <p className="text-xs text-gray-500"> 
                 We typically respond within 24 hours 
               </p> 
             </div> 
           </div> 
         </div> 
       )} 
     </> 
   ); 
 };