import { useState } from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '~/components/FileUploader'
import Navbar from '~/components/Navbar'
import { convertPdfToImage } from '~/lib/pdf2img'
import { usePuterStore } from '~/lib/puter'
import { generateUUID } from '~/lib/utils'
import { prepareInstructions } from '../../constants'

interface FormFields {
    companyName: string,
    jobTitle: string,
    jobDescription: string,
    file: File
}

const Upload = () => {

    const {auth, isLoading, fs, ai, kv} = usePuterStore()
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState("")
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: FormFields) => {

        setIsProcessing(true)
        setStatusText("uploading the file...")
        
        const uplaodedFile = await fs.upload([file])
        if(!uplaodedFile) return setStatusText("Error: Failed to upload file")

        setStatusText("Converting to Image")
        
        const imageFile = await convertPdfToImage(file)
        if(!imageFile.file) return setStatusText("Error: Failed to convert PDF to image")
            
        setStatusText("uploading the image")
            
        const uploadedImage = await fs.upload([imageFile.file])
        if(!uploadedImage) return setStatusText("Error: Failed to upload image")

        setStatusText("preparing data...")

        const uuid = generateUUID()


        const data = {
            id: uuid,
            resumePath: uplaodedFile.path,
            imagePath: uploadedImage.path,
            companyName,
            jobTitle,
            jobDescription,
            feedback: "",
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        
        setStatusText("analyzing...")

        const feedback = await ai.feedback(uplaodedFile.path, prepareInstructions({jobTitle, jobDescription}))
        if(!feedback) return setStatusText("Error: Failed to analyze resume")

        const feedbackText = typeof feedback.message.content === "string" 
        ? feedback.message.content 
        : feedback.message.content[0].text

        data.feedback = JSON.parse(feedbackText)

        await kv.set(`resume:${uuid}`, JSON.stringify(data))

        setStatusText("Analysis complete, redirecting...")

        console.log(data)

        navigate(`/resume/${uuid}`)
    }   


    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget.closest('form')
        if(!form) return
        const formData = new FormData(form)
        
        const companyName = formData.get('company-name') as string
        const jobTitle = formData.get('job-title') as string
        const jobDescription = formData.get('job-decription') as string

        console.log({companyName, jobTitle, jobDescription, file})
        
        if(!file) return

        handleAnalyze({companyName, jobTitle, jobDescription, file})
    }

  return (
    <main className="bg-cover bg-[url('/images/bg-main.svg')] ">
    <Navbar />
    <section className='main-section'>
        <div className='page-heading py-16'>
            <h1>Smart Feedback for your dream Job!</h1>
            {isProcessing ? 
                <>
                <h2>
                    {statusText}
                </h2>
                <img src='/images/resume-scan.gif' className='w-full' />
                </>
            :
            <h2>
                Drop your resume for an ATS score and improvement tips
            </h2>
            }
            {!isProcessing && 
            <form id="upload-form" onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                <div className='form-div'>
                    <label htmlFor='company-name'>
                        Company Name
                    </label>
                    <input
                    type='text'
                    name='company-name'
                    id="company-name"
                    placeholder='Enter Company name'
                    />
                </div>
                <div className='form-div'>
                    <label htmlFor='job-title'>
                        Job Title
                    </label>
                    <input
                    type='text'
                    name='job-title'
                    id="job-title"
                    placeholder='Enter Job Title'
                    />
                </div>
                <div className='form-div'>
                    <label htmlFor='job-decription'>
                        Job Description
                    </label>
                    <textarea
                    rows={5}
                    name='job-decription'
                    id="job-decription"
                    placeholder='Enter Job Description'
                    />
                </div>
                <div className="form-div">
                    <label htmlFor="uploader">Upload Resume</label>
                     <FileUploader onFileSelect={handleFileSelect} file={file} />
                </div>
                <button type='submit' className='primary-button' >
                    Analyze Resume
                </button>
            </form>
            }
        </div>
    </section>
    </main>
  )
}

export default Upload