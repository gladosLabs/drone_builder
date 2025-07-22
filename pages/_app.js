import '../styles/globals.css'
import Navbar from '../components/ui/navbar'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  )
} 