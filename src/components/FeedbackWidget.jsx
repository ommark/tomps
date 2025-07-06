import React, { useState } from 'react';
// CORRECTED PATH: Go up one level from 'components' to 'src', then into 'context'
import { useAppContext } from '../context/AppContext';
// CORRECTED PATH: Go up one level from 'components' to 'src', then into 'services'
import { addFeedback } from '../services/firebase';

export default function FeedbackWidget() {
    const { userId, showToast } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim() || !userId) return;

        setIsSubmitting(true);
        try {
            await addFeedback(userId, feedbackText);
            showToast('Thank you for your feedback!', 'success');
            setFeedbackText('');
            setIsOpen(false);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            showToast('Could not send feedback. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* The Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-full shadow-lg z-40 transition-transform transform hover:scale-105"
                aria-label="Send Feedback"
            >
                Feedback
            </button>

            {/* The Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold text-purple-300 mb-4">Share Your Thoughts</h2>
                        <p className="text-gray-400 mb-6">What's working? What's not? Your feedback helps make tomps better.</p>
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Your feedback..."
                                className="w-full h-32 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                required
                            />
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-500"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}