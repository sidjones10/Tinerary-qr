"use client"

import React, { useState, ReactNode } from "react"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  component: ReactNode
  validate?: () => Promise<boolean> | boolean
  optional?: boolean
}

interface WizardProps {
  steps: WizardStep[]
  onComplete: () => void | Promise<void>
  onStepChange?: (currentStep: number) => void
  initialStep?: number
  showProgress?: boolean
  allowSkip?: boolean
  className?: string
}

export function Wizard({
  steps,
  onComplete,
  onStepChange,
  initialStep = 0,
  showProgress = true,
  allowSkip = false,
  className,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isValidating, setIsValidating] = useState(false)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepData = steps[currentStep]

  const handleNext = async () => {
    // Validate current step if validator exists
    if (currentStepData.validate) {
      setIsValidating(true)
      const isValid = await currentStepData.validate()
      setIsValidating(false)

      if (!isValid) {
        return
      }
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]))

    if (isLastStep) {
      await onComplete()
    } else {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      onStepChange?.(nextStep)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      onStepChange?.(prevStep)
    }
  }

  const handleSkip = () => {
    if (allowSkip && currentStepData.optional && !isLastStep) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      onStepChange?.(nextStep)
    }
  }

  const goToStep = (stepIndex: number) => {
    // Only allow going to completed steps or the next step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex)
      onStepChange?.(stepIndex)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            const isCurrent = index === currentStep
            const isAccessible = index <= currentStep || completedSteps.has(index - 1)

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => goToStep(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all",
                    isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                      isCurrent &&
                        "bg-gradient-to-r from-orange-500 to-pink-500 text-white ring-4 ring-orange-100 scale-110",
                      isCompleted && !isCurrent && "bg-green-500 text-white",
                      !isCurrent && !isCompleted && "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </div>

                  {/* Label */}
                  <div className="text-center hidden sm:block">
                    <div
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isCurrent ? "text-orange-600" : "text-gray-600"
                      )}
                    >
                      {step.title}
                    </div>
                  </div>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6 md:p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
          {currentStepData.description && <p className="text-gray-600">{currentStepData.description}</p>}
        </div>

        <div className="min-h-[300px]">{currentStepData.component}</div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className={cn("transition-opacity", isFirstStep && "opacity-0 pointer-events-none")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-3">
          {allowSkip && currentStepData.optional && !isLastStep && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={isValidating}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            {isValidating ? (
              "Validating..."
            ) : isLastStep ? (
              "Complete"
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for managing wizard state in parent component
 */
export function useWizard(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const nextStep = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step)
    }
  }

  const reset = () => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
  }

  return {
    currentStep,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    reset,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    progress: ((currentStep + 1) / totalSteps) * 100,
  }
}
