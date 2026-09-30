import React from 'react'

function ErrorMessage({ error }) {
    return (
        <div className="error-message">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
                Try Again
            </button>
        </div>
    );
}

export default ErrorMessage;