export default function RootLayout({ children }){
  return (
    <html lang="ar" dir="rtl">
      <body>
        <nav className="w-full sticky top-0 bg-white/80 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
            <div className="font-bold">فريق التطوير</div>
            <div className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">الرئيسية</a>
              <a href="/projects" className="hover:underline">المشاريع</a>
              <a href="/about" className="hover:underline">عن الفريق</a>
              <a href="/contact" className="hover:underline">تواصل</a>
              <a href="/app" className="btn">دخول الأعضاء</a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
        <footer className="border-t mt-10 p-6 text-center text-sm text-gray-500">© 2025 فريق التطوير</footer>
      </body>
    </html>
  )
}
