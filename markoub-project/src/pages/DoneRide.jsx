import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RidesAPI } from '../utils/api';
import { Spinner } from '../components/Spinner';

export default function DoneRide() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await RidesAPI.get(id);
        if (mounted) setRide(res);
      } catch (err) {
        console.error('Failed to load ride', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  if (isLoading) return (
    <div className="py-24 flex items-center justify-center">
      <Spinner className="w-12 h-12" />
    </div>
  );

  if (!ride) return (
    <div className="py-24 text-center">Ride not found.</div>
  );

  return (
    <section className="py-8 md:py-16 min-h-screen">
      <div className="container mx-auto px-4 mt-16 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Ride Finished</h2>
          <div className="text-slate-700 mb-4">
            <div className="font-medium">{ride.from_location} → {ride.to_location}</div>
            <div className="text-sm text-slate-500">{ride.ride_date} • {ride.ride_time}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-rides')}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md"
            >
              Back to My Rides
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
